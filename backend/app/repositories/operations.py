"""Operations center persistence."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrderStatus, PartnerStaffRole, TaskAssignmentStatus, TaskAssignmentType
from app.models.laundry import Laundry
from app.models.order import Order, OrderStatusEvent
from app.models.order_task_assignment import OrderTaskAssignment
from app.models.partner_staff import PartnerStaff
from app.models.user import User

ACTIVE_ASSIGNMENT_STATUSES = (
    TaskAssignmentStatus.scheduled,
    TaskAssignmentStatus.assigned,
    TaskAssignmentStatus.in_progress,
)

PICKUP_ROLES = {
    PartnerStaffRole.owner,
    PartnerStaffRole.manager,
    PartnerStaffRole.pickup_agent,
    PartnerStaffRole.pickup_only,
    PartnerStaffRole.full_access,
}

DELIVERY_ROLES = {
    PartnerStaffRole.owner,
    PartnerStaffRole.manager,
    PartnerStaffRole.delivery_agent,
    PartnerStaffRole.delivery_only,
    PartnerStaffRole.full_access,
}


class OperationsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_laundry_for_owner(self, owner_user_id: UUID) -> Laundry | None:
        return await self._session.scalar(
            select(Laundry).where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None)),
        )

    async def get_staff_by_user(self, user_id: UUID) -> PartnerStaff | None:
        return await self._session.scalar(
            select(PartnerStaff).where(PartnerStaff.user_id == user_id, PartnerStaff.deleted_at.is_(None)),
        )

    async def get_order(self, order_id: UUID, laundry_id: UUID) -> Order | None:
        return await self._session.scalar(
            select(Order)
            .where(Order.id == order_id, Order.laundry_id == laundry_id, Order.deleted_at.is_(None))
            .options(selectinload(Order.items)),
        )

    async def list_orders_with_customers(
        self,
        laundry_id: UUID,
        *,
        statuses: tuple[OrderStatus, ...] | None = None,
        delivered_since: datetime | None = None,
        active_since: datetime | None = None,
        limit: int | None = None,
        order_by_pickup_asc: bool = True,
    ) -> list[tuple[Order, str, str | None]]:
        """Return (order, customer_name, phone). Phone prefers order.customer_phone then user.phone."""
        q = (
            select(Order, User.full_name, User.phone)
            .join(User, User.id == Order.user_id)
            .where(Order.laundry_id == laundry_id, Order.deleted_at.is_(None))
            .options(selectinload(Order.items))
        )
        if statuses:
            q = q.where(Order.status.in_(statuses))
        if delivered_since is not None:
            q = q.where(
                Order.delivered_at.isnot(None),
                Order.delivered_at >= delivered_since,
            )
        if active_since is not None:
            q = q.where(
                or_(
                    Order.updated_at >= active_since,
                    Order.pickup_at >= active_since,
                ),
            )
        if order_by_pickup_asc:
            q = q.order_by(Order.pickup_at.asc())
        else:
            q = q.order_by(Order.updated_at.desc().nullslast())
        if limit is not None:
            q = q.limit(limit)
        result = await self._session.execute(q)
        return [
            (order, name, order.customer_phone or user_phone)
            for order, name, user_phone in result.all()
        ]

    async def list_assignments(self, laundry_id: UUID) -> list[OrderTaskAssignment]:
        result = await self._session.scalars(
            select(OrderTaskAssignment)
            .where(OrderTaskAssignment.laundry_id == laundry_id)
            .order_by(OrderTaskAssignment.assigned_at.desc()),
        )
        return list(result.all())

    async def get_active_assignment(
        self,
        order_id: UUID,
        task_type: TaskAssignmentType,
    ) -> OrderTaskAssignment | None:
        return await self._session.scalar(
            select(OrderTaskAssignment)
            .where(
                OrderTaskAssignment.order_id == order_id,
                OrderTaskAssignment.task_type == task_type,
                OrderTaskAssignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES),
            )
            .order_by(OrderTaskAssignment.assigned_at.desc())
            .limit(1),
        )

    async def get_assignment(self, assignment_id: UUID, laundry_id: UUID) -> OrderTaskAssignment | None:
        return await self._session.scalar(
            select(OrderTaskAssignment).where(
                OrderTaskAssignment.id == assignment_id,
                OrderTaskAssignment.laundry_id == laundry_id,
            ),
        )

    async def get_staff(self, staff_id: UUID, laundry_id: UUID) -> PartnerStaff | None:
        return await self._session.scalar(
            select(PartnerStaff).where(
                PartnerStaff.id == staff_id,
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
                PartnerStaff.is_active.is_(True),
            ),
        )

    async def list_drivers(self, laundry_id: UUID) -> list[PartnerStaff]:
        result = await self._session.scalars(
            select(PartnerStaff).where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
                PartnerStaff.is_active.is_(True),
                PartnerStaff.role.in_(tuple(PICKUP_ROLES | DELIVERY_ROLES)),
            ).order_by(PartnerStaff.name.asc()),
        )
        return list(result.all())

    async def staff_active_tasks(self, staff_id: UUID) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(OrderTaskAssignment)
                .where(
                    OrderTaskAssignment.staff_id == staff_id,
                    OrderTaskAssignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES),
                ),
            )
            or 0,
        )

    async def staff_completed_today(self, staff_id: UUID) -> int:
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(OrderTaskAssignment)
                .where(
                    OrderTaskAssignment.staff_id == staff_id,
                    OrderTaskAssignment.status == TaskAssignmentStatus.completed,
                    OrderTaskAssignment.completed_at.isnot(None),
                    OrderTaskAssignment.completed_at >= today_start,
                ),
            )
            or 0,
        )

    async def assigned_drivers_count(self, laundry_id: UUID) -> int:
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(OrderTaskAssignment.staff_id)))
                .where(
                    OrderTaskAssignment.laundry_id == laundry_id,
                    OrderTaskAssignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES),
                ),
            )
            or 0,
        )

    async def active_drivers_count(self, laundry_id: UUID) -> int:
        """Drivers with at least one active task right now."""
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(OrderTaskAssignment.staff_id)))
                .where(
                    OrderTaskAssignment.laundry_id == laundry_id,
                    OrderTaskAssignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES),
                ),
            )
            or 0,
        )

    async def count_failed_deliveries_today(self, laundry_id: UUID, since: datetime) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(OrderTaskAssignment)
                .where(
                    OrderTaskAssignment.laundry_id == laundry_id,
                    OrderTaskAssignment.task_type == TaskAssignmentType.delivery,
                    OrderTaskAssignment.status == TaskAssignmentStatus.failed,
                    OrderTaskAssignment.completed_at.isnot(None),
                    OrderTaskAssignment.completed_at >= since,
                ),
            )
            or 0,
        )

    async def avg_delivery_time_minutes(self, laundry_id: UUID, since: datetime) -> float | None:
        delivered = await self._session.scalars(
            select(Order).where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.delivered_at.isnot(None),
                Order.delivered_at >= since,
            ),
        )
        orders = list(delivered.all())
        if not orders:
            return None
        total_minutes = 0.0
        count = 0
        for order in orders:
            out_event = await self._session.scalar(
                select(OrderStatusEvent.created_at)
                .where(
                    OrderStatusEvent.order_id == order.id,
                    OrderStatusEvent.status == OrderStatus.out_for_delivery,
                )
                .order_by(OrderStatusEvent.created_at.asc())
                .limit(1),
            )
            if out_event and order.delivered_at:
                delta = (order.delivered_at - out_event).total_seconds() / 60.0
                if delta >= 0:
                    total_minutes += delta
                    count += 1
        return round(total_minutes / count, 1) if count else None

    async def count_delayed_orders(self, laundry_id: UUID, now: datetime) -> int:
        pickup_delayed = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.confirmed, OrderStatus.pickup_assigned)),
                Order.pickup_at < now,
            ),
        )
        delivery_delayed = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.ready, OrderStatus.out_for_delivery)),
                Order.delivery_at < now,
            ),
        )
        return int(pickup_delayed or 0) + int(delivery_delayed or 0)

    async def count_pickups_today(self, laundry_id: UUID, today_start: datetime) -> int:
        tomorrow = today_start + timedelta(days=1)
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.pickup_at >= today_start,
                    Order.pickup_at < tomorrow,
                    Order.status != OrderStatus.cancelled,
                ),
            )
            or 0,
        )

    async def count_deliveries_today(self, laundry_id: UUID, today_start: datetime) -> int:
        tomorrow = today_start + timedelta(days=1)
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.delivery_at >= today_start,
                    Order.delivery_at < tomorrow,
                    Order.status != OrderStatus.cancelled,
                ),
            )
            or 0,
        )

    async def count_completed_today(self, laundry_id: UUID, today_start: datetime) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.status == OrderStatus.delivered,
                    Order.delivered_at.isnot(None),
                    Order.delivered_at >= today_start,
                ),
            )
            or 0,
        )

    async def count_pending_tasks(self, laundry_id: UUID) -> int:
        """Orders waiting for ops action — SQL counts (no full order dump)."""
        from sqlalchemy import exists

        confirmed = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.status == OrderStatus.confirmed,
                ),
            )
            or 0,
        )
        has_active_pickup = exists().where(
            OrderTaskAssignment.order_id == Order.id,
            OrderTaskAssignment.laundry_id == laundry_id,
            OrderTaskAssignment.task_type == TaskAssignmentType.pickup,
            OrderTaskAssignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES),
        )
        unassigned_pickup = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.status == OrderStatus.pickup_assigned,
                    ~has_active_pickup,
                ),
            )
            or 0,
        )
        has_active_delivery = exists().where(
            OrderTaskAssignment.order_id == Order.id,
            OrderTaskAssignment.laundry_id == laundry_id,
            OrderTaskAssignment.task_type == TaskAssignmentType.delivery,
            OrderTaskAssignment.status.in_(
                (
                    TaskAssignmentStatus.scheduled,
                    TaskAssignmentStatus.assigned,
                    TaskAssignmentStatus.in_progress,
                    TaskAssignmentStatus.failed,
                    TaskAssignmentStatus.returned,
                ),
            ),
        )
        unassigned_ready = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.status == OrderStatus.ready,
                    ~has_active_delivery,
                ),
            )
            or 0,
        )
        return confirmed + unassigned_pickup + unassigned_ready

    async def staff_name_map(self, laundry_id: UUID) -> dict[UUID, str]:
        result = await self._session.execute(
            select(PartnerStaff.id, PartnerStaff.name).where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
            ),
        )
        return {row[0]: row[1] for row in result.all()}
