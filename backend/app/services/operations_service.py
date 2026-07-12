"""Pickup & delivery operations center business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.enums import (
    OrderStatus,
    PartnerStaffRole,
    StaffActivityAction,
    TaskAssignmentStatus,
    TaskAssignmentType,
    UserRole,
)
from app.models.order import OrderStatusEvent
from app.models.order_task_assignment import OrderTaskAssignment
from app.repositories.operations import ACTIVE_ASSIGNMENT_STATUSES, DELIVERY_ROLES, PICKUP_ROLES, OperationsRepository
from app.services.order_events import publish_order_status_update
from app.services.staff_permissions import ROLE_LABELS

PICKUP_BUCKET_LABELS = {
    "scheduled": "Scheduled",
    "assigned": "Assigned",
    "in_progress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
}

DELIVERY_BUCKET_LABELS = {
    "ready": "Ready",
    "assigned": "Assigned",
    "out_for_delivery": "Out For Delivery",
    "delivered": "Delivered",
    "failed": "Failed",
    "returned": "Returned",
}


class OperationsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = OperationsRepository(session)

    async def _resolve_laundry(self, actor_user_id: UUID, actor_role: str):
        if actor_role == UserRole.partner.value:
            laundry = await self._repo.get_laundry_for_owner(actor_user_id)
            if not laundry:
                raise NotFoundError("Partner laundry not found")
            return laundry
        if actor_role == UserRole.partner_staff.value:
            staff = await self._repo.get_staff_by_user(actor_user_id)
            if not staff or not staff.is_active:
                raise AuthorizationError()
            from app.models.laundry import Laundry

            laundry = await self._session.get(Laundry, staff.laundry_id)
            if not laundry:
                raise NotFoundError("Laundry not found")
            return laundry
        if actor_role in (UserRole.admin.value, UserRole.super_admin.value):
            laundry = await self._repo.get_laundry_for_owner(actor_user_id)
            if laundry:
                return laundry
            raise AuthorizationError()
        raise AuthorizationError()

    def _require_operations_access(self, actor_role: str) -> None:
        if actor_role not in (
            UserRole.partner.value,
            UserRole.partner_staff.value,
            UserRole.admin.value,
            UserRole.super_admin.value,
        ):
            raise AuthorizationError()

    def _is_delayed(self, order, now: datetime) -> bool:
        if order.status in (OrderStatus.confirmed, OrderStatus.pickup_assigned):
            return order.pickup_at < now
        if order.status in (OrderStatus.ready, OrderStatus.out_for_delivery):
            return order.delivery_at < now
        return False

    def _serialize_assignment(self, assignment: OrderTaskAssignment, staff_names: dict) -> dict:
        return {
            "id": assignment.id,
            "staff_id": assignment.staff_id,
            "staff_name": staff_names.get(assignment.staff_id, "Unknown"),
            "status": assignment.status.value,
            "assigned_at": assignment.assigned_at,
            "started_at": assignment.started_at,
            "completed_at": assignment.completed_at,
        }

    def _serialize_order_row(
        self,
        order,
        customer_name: str,
        *,
        queue_status: str,
        assignment: OrderTaskAssignment | None,
        staff_names: dict,
        now: datetime,
    ) -> dict:
        return {
            "order_id": order.id,
            "tracking_code": order.tracking_code,
            "customer_name": customer_name,
            "status": order.status.value,
            "pickup_at": order.pickup_at,
            "delivery_at": order.delivery_at,
            "total_inr": str(Decimal(order.total_inr).quantize(Decimal("0.01"))),
            "is_delayed": self._is_delayed(order, now),
            "queue_status": queue_status,
            "assignment": self._serialize_assignment(assignment, staff_names) if assignment else None,
        }

    def _pickup_queue_status(
        self,
        order,
        pickup_assignment: OrderTaskAssignment | None,
    ) -> str | None:
        if order.status == OrderStatus.cancelled:
            return "cancelled"
        if order.status in (
            OrderStatus.picked_up,
            OrderStatus.washing,
            OrderStatus.ironing,
            OrderStatus.ready,
            OrderStatus.out_for_delivery,
            OrderStatus.delivered,
        ):
            return "completed"
        if pickup_assignment and pickup_assignment.status == TaskAssignmentStatus.in_progress:
            return "in_progress"
        if order.status == OrderStatus.pickup_assigned:
            return "assigned" if pickup_assignment else "assigned"
        if order.status == OrderStatus.confirmed:
            return "scheduled"
        return None

    def _delivery_queue_status(
        self,
        order,
        delivery_assignment: OrderTaskAssignment | None,
    ) -> str | None:
        if delivery_assignment:
            if delivery_assignment.status == TaskAssignmentStatus.failed:
                return "failed"
            if delivery_assignment.status == TaskAssignmentStatus.returned:
                return "returned"
            if (
                order.status == OrderStatus.ready
                and delivery_assignment.status in (
                    TaskAssignmentStatus.scheduled,
                    TaskAssignmentStatus.assigned,
                )
            ):
                return "assigned"
        if order.status == OrderStatus.delivered:
            return "delivered"
        if order.status == OrderStatus.out_for_delivery:
            return "out_for_delivery"
        if order.status == OrderStatus.ready:
            return "ready"
        return None

    async def dashboard(self, actor_user_id: UUID, actor_role: str) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        pickups_today = await self._repo.count_pickups_today(laundry.id, today_start)
        deliveries_today = await self._repo.count_deliveries_today(laundry.id, today_start)
        delayed = await self._repo.count_delayed_orders(laundry.id, now)
        assigned_drivers = await self._repo.assigned_drivers_count(laundry.id)
        active_drivers = await self._repo.active_drivers_count(laundry.id)
        failed_deliveries = await self._repo.count_failed_deliveries_today(laundry.id, today_start)
        completed_today = await self._repo.count_completed_today(laundry.id, today_start)
        avg_delivery = await self._repo.avg_delivery_time_minutes(laundry.id, today_start)

        orders = await self._repo.list_orders_with_customers(laundry.id)
        assignments = await self._repo.list_assignments(laundry.id)
        pickup_map = {
            a.order_id: a
            for a in assignments
            if a.task_type == TaskAssignmentType.pickup and a.status in (
                TaskAssignmentStatus.scheduled,
                TaskAssignmentStatus.assigned,
                TaskAssignmentStatus.in_progress,
            )
        }
        delivery_map = {
            a.order_id: a
            for a in assignments
            if a.task_type == TaskAssignmentType.delivery and a.status in (
                TaskAssignmentStatus.scheduled,
                TaskAssignmentStatus.assigned,
                TaskAssignmentStatus.in_progress,
                TaskAssignmentStatus.failed,
                TaskAssignmentStatus.returned,
            )
        }

        pending = 0
        for order, _ in orders:
            if order.status == OrderStatus.confirmed:
                pending += 1
            elif order.status == OrderStatus.pickup_assigned and order.id not in pickup_map:
                pending += 1
            elif order.status == OrderStatus.ready and order.id not in delivery_map:
                pending += 1

        return {
            "laundry_id": laundry.id,
            "laundry_name": laundry.name,
            "pickups_today": pickups_today,
            "deliveries_today": deliveries_today,
            "todays_pickups": pickups_today,
            "todays_deliveries": deliveries_today,
            "delayed_orders": delayed,
            "assigned_drivers": assigned_drivers,
            "active_drivers": active_drivers,
            "pending_tasks": pending,
            "failed_deliveries": failed_deliveries,
            "avg_delivery_time_minutes": avg_delivery,
            "completed_orders_today": completed_today,
        }

    async def pickup_queue(self, actor_user_id: UUID, actor_role: str) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        now = datetime.now(UTC)
        staff_names = await self._repo.staff_name_map(laundry.id)
        assignments = await self._repo.list_assignments(laundry.id)
        pickup_by_order = {
            a.order_id: a
            for a in assignments
            if a.task_type == TaskAssignmentType.pickup
        }

        buckets: dict[str, list] = {k: [] for k in PICKUP_BUCKET_LABELS}
        for order, customer_name in await self._repo.list_orders_with_customers(laundry.id):
            queue_status = self._pickup_queue_status(order, pickup_by_order.get(order.id))
            if not queue_status:
                continue
            active = pickup_by_order.get(order.id)
            if queue_status == "completed" and active and active.status not in (
                TaskAssignmentStatus.completed,
                TaskAssignmentStatus.cancelled,
            ):
                active = None
            buckets[queue_status].append(
                self._serialize_order_row(
                    order,
                    customer_name,
                    queue_status=queue_status,
                    assignment=active if queue_status in ("assigned", "in_progress") else pickup_by_order.get(order.id),
                    staff_names=staff_names,
                    now=now,
                ),
            )

        result_buckets = [
            {
                "status": status,
                "label": label,
                "count": len(buckets[status]),
                "orders": buckets[status],
            }
            for status, label in PICKUP_BUCKET_LABELS.items()
        ]
        total = sum(b["count"] for b in result_buckets)
        return {"buckets": result_buckets, "total": total}

    async def delivery_queue(self, actor_user_id: UUID, actor_role: str) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        now = datetime.now(UTC)
        staff_names = await self._repo.staff_name_map(laundry.id)
        assignments = await self._repo.list_assignments(laundry.id)
        delivery_by_order: dict = {}
        for a in assignments:
            if a.task_type != TaskAssignmentType.delivery:
                continue
            existing = delivery_by_order.get(a.order_id)
            if not existing or a.assigned_at > existing.assigned_at:
                delivery_by_order[a.order_id] = a

        buckets: dict[str, list] = {k: [] for k in DELIVERY_BUCKET_LABELS}
        for order, customer_name in await self._repo.list_orders_with_customers(laundry.id):
            assignment = delivery_by_order.get(order.id)
            queue_status = self._delivery_queue_status(order, assignment)
            if not queue_status:
                continue
            buckets[queue_status].append(
                self._serialize_order_row(
                    order,
                    customer_name,
                    queue_status=queue_status,
                    assignment=assignment if queue_status not in ("delivered",) else assignment,
                    staff_names=staff_names,
                    now=now,
                ),
            )

        result_buckets = [
            {
                "status": status,
                "label": label,
                "count": len(buckets[status]),
                "orders": buckets[status],
            }
            for status, label in DELIVERY_BUCKET_LABELS.items()
        ]
        total = sum(b["count"] for b in result_buckets)
        return {"buckets": result_buckets, "total": total}

    async def list_drivers(self, actor_user_id: UUID, actor_role: str) -> list[dict]:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        rows = []
        for staff in await self._repo.list_drivers(laundry.id):
            active = await self._repo.staff_active_tasks(staff.id)
            completed = await self._repo.staff_completed_today(staff.id)
            capacity = staff.daily_capacity or 8
            workload_pct = round(min(100.0, (active / capacity) * 100), 1) if capacity else 100.0
            role_val = staff.role.value if hasattr(staff.role, "value") else str(staff.role)
            rows.append(
                {
                    "staff_id": staff.id,
                    "name": staff.name,
                    "role": role_val,
                    "role_label": ROLE_LABELS.get(role_val, role_val),
                    "is_active": staff.is_active,
                    "daily_capacity": capacity,
                    "active_tasks": active,
                    "completed_today": completed,
                    "workload_pct": workload_pct,
                    "available": active < capacity,
                },
            )
        return rows

    def _validate_staff_for_task(self, staff, task_type: TaskAssignmentType) -> None:
        allowed = PICKUP_ROLES if task_type == TaskAssignmentType.pickup else DELIVERY_ROLES
        if staff.role not in allowed:
            raise ValidationError(f"Staff role cannot be assigned to {task_type.value} tasks")

    async def assign_driver(
        self,
        actor_user_id: UUID,
        actor_role: str,
        *,
        order_id: UUID,
        staff_id: UUID,
        task_type: TaskAssignmentType,
        notes: str | None = None,
    ) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        order = await self._repo.get_order(order_id, laundry.id)
        if not order:
            raise NotFoundError("Order not found")

        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        self._validate_staff_for_task(staff, task_type)

        active_count = await self._repo.staff_active_tasks(staff_id)
        if active_count >= (staff.daily_capacity or 8):
            raise ValidationError("Driver has reached daily capacity")

        if task_type == TaskAssignmentType.pickup:
            if order.status not in (OrderStatus.confirmed, OrderStatus.pickup_assigned):
                raise ValidationError("Order is not eligible for pickup assignment")
        else:
            if order.status not in (OrderStatus.ready, OrderStatus.out_for_delivery):
                raise ValidationError("Order is not eligible for delivery assignment")

        existing = await self._repo.get_active_assignment(order_id, task_type)
        if existing:
            existing.status = TaskAssignmentStatus.cancelled
            existing.completed_at = datetime.now(UTC)

        now = datetime.now(UTC)
        assignment = OrderTaskAssignment(
            order_id=order.id,
            laundry_id=laundry.id,
            task_type=task_type,
            staff_id=staff_id,
            status=TaskAssignmentStatus.assigned,
            assigned_by_user_id=actor_user_id,
            assigned_at=now,
            notes=notes,
        )
        self._session.add(assignment)

        if task_type == TaskAssignmentType.pickup and order.status == OrderStatus.confirmed:
            order.status = OrderStatus.pickup_assigned
            event = OrderStatusEvent(order_id=order.id, status=OrderStatus.pickup_assigned)
            self._session.add(event)
            await self._session.flush()
            await publish_order_status_update(order, event)

        await self._log_assignment(laundry.id, staff, order, task_type, actor_user_id, "assigned")
        await self._session.flush()

        staff_names = await self._repo.staff_name_map(laundry.id)
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(order.user_id)
        return self._serialize_order_row(
            order,
            customer.full_name if customer else "Customer",
            queue_status="assigned",
            assignment=assignment,
            staff_names=staff_names,
            now=now,
        )

    async def reassign_driver(
        self,
        actor_user_id: UUID,
        actor_role: str,
        assignment_id: UUID,
        *,
        staff_id: UUID,
        notes: str | None = None,
    ) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        assignment = await self._repo.get_assignment(assignment_id, laundry.id)
        if not assignment:
            raise NotFoundError("Assignment not found")
        if assignment.status not in ACTIVE_ASSIGNMENT_STATUSES:
            raise ValidationError("Cannot reassign a completed or cancelled assignment")

        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        self._validate_staff_for_task(staff, assignment.task_type)

        active_count = await self._repo.staff_active_tasks(staff_id)
        if active_count >= (staff.daily_capacity or 8):
            raise ValidationError("Driver has reached daily capacity")

        assignment.staff_id = staff_id
        assignment.status = TaskAssignmentStatus.assigned
        assignment.assigned_at = datetime.now(UTC)
        assignment.assigned_by_user_id = actor_user_id
        assignment.started_at = None
        if notes:
            assignment.notes = notes

        order = await self._repo.get_order(assignment.order_id, laundry.id)
        if not order:
            raise NotFoundError("Order not found")

        await self._log_assignment(
            laundry.id,
            staff,
            order,
            assignment.task_type,
            actor_user_id,
            "reassigned",
        )
        await self._session.flush()

        staff_names = await self._repo.staff_name_map(laundry.id)
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(order.user_id)
        return self._serialize_order_row(
            order,
            customer.full_name if customer else "Customer",
            queue_status=assignment.status.value,
            assignment=assignment,
            staff_names=staff_names,
            now=datetime.now(UTC),
        )

    async def update_assignment_status(
        self,
        actor_user_id: UUID,
        actor_role: str,
        assignment_id: UUID,
        *,
        status: TaskAssignmentStatus,
        notes: str | None = None,
    ) -> dict:
        self._require_operations_access(actor_role)
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        assignment = await self._repo.get_assignment(assignment_id, laundry.id)
        if not assignment:
            raise NotFoundError("Assignment not found")

        order = await self._repo.get_order(assignment.order_id, laundry.id)
        if not order:
            raise NotFoundError("Order not found")

        now = datetime.now(UTC)
        assignment.status = status
        if notes:
            assignment.notes = notes

        if status == TaskAssignmentStatus.in_progress:
            assignment.started_at = now
            if assignment.task_type == TaskAssignmentType.delivery and order.status == OrderStatus.ready:
                order.status = OrderStatus.out_for_delivery
                event = OrderStatusEvent(order_id=order.id, status=OrderStatus.out_for_delivery)
                self._session.add(event)
                await self._session.flush()
                await publish_order_status_update(order, event)
        elif status in (TaskAssignmentStatus.completed, TaskAssignmentStatus.failed, TaskAssignmentStatus.returned):
            assignment.completed_at = now
            if status == TaskAssignmentStatus.failed and order.status == OrderStatus.out_for_delivery:
                pass
            elif status == TaskAssignmentStatus.returned and order.status == OrderStatus.out_for_delivery:
                order.status = OrderStatus.ready
                event = OrderStatusEvent(order_id=order.id, status=OrderStatus.ready, note="Delivery returned")
                self._session.add(event)
                await self._session.flush()
                await publish_order_status_update(order, event)

        staff = await self._repo.get_staff(assignment.staff_id, laundry.id)
        if staff:
            await self._log_assignment(
                laundry.id,
                staff,
                order,
                assignment.task_type,
                actor_user_id,
                status.value,
            )

        await self._session.flush()
        staff_names = await self._repo.staff_name_map(laundry.id)
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(order.user_id)
        return self._serialize_order_row(
            order,
            customer.full_name if customer else "Customer",
            queue_status=status.value,
            assignment=assignment,
            staff_names=staff_names,
            now=now,
        )

    async def complete_assignment_for_order(
        self,
        order_id: UUID,
        task_type: TaskAssignmentType,
    ) -> None:
        assignment = await self._repo.get_active_assignment(order_id, task_type)
        if not assignment:
            return
        assignment.status = TaskAssignmentStatus.completed
        assignment.completed_at = datetime.now(UTC)

    async def _log_assignment(
        self,
        laundry_id: UUID,
        staff,
        order,
        task_type: TaskAssignmentType,
        actor_user_id: UUID,
        action: str,
    ) -> None:
        from app.repositories.staff_management import StaffManagementRepository

        await StaffManagementRepository(self._session).log_activity(
            laundry_id=laundry_id,
            action=StaffActivityAction.assignment,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="order",
            resource_id=str(order.id),
            description=f"{action.title()} {task_type.value} for #{order.tracking_code} → {staff.name}",
            metadata={"task_type": task_type.value, "action": action},
        )

