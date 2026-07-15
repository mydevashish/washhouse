"""Partner inventory, staff, and analytics."""

from __future__ import annotations

from uuid import UUID

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.enums import OrderStatus
from app.models.order import Order, OrderInventory
from app.models.partner_staff import PartnerStaff
from app.models.user import User
from app.repositories.inventory import InventoryRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.staff import StaffRepository


class PartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._orders = OrderRepository(session)
        self._inventory = InventoryRepository(session)
        self._staff = StaffRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return laundry

    async def _laundry_ids_for_partner(self, partner_user_id: UUID) -> list[UUID]:
        laundries = await self._laundries.list_by_owner(partner_user_id)
        if not laundries:
            raise NotFoundError("Partner laundry not found")
        return [laundry.id for laundry in laundries]

    async def empty_analytics_summary(self, partner_user_id: UUID) -> dict:
        """Dashboard-safe zeros when partner has no laundry yet (e.g. pending onboarding)."""
        from decimal import Decimal

        from app.repositories.user import UserRepository

        user = await UserRepository(self._session).get_by_id(partner_user_id)
        name = user.full_name if user else "Your laundry"
        return {
            "laundry_id": None,
            "laundry_name": name,
            "avg_rating": "0.00",
            "review_count": 0,
            "orders_total": 0,
            "orders_today": 0,
            "orders_pending": 0,
            "orders_in_progress": 0,
            "orders_ready": 0,
            "pickup_requests": 0,
            "orders_delivered": 0,
            "customers_count": 0,
            "revenue_inr": str(Decimal("0.00")),
            "revenue_today_inr": str(Decimal("0.00")),
            "revenue_this_month_inr": str(Decimal("0.00")),
            "revenue_week_inr": str(Decimal("0.00")),
        }

    async def get_inventory(self, partner_user_id: UUID, order_id: UUID) -> OrderInventory:
        laundry = await self._laundry_for_partner(partner_user_id)
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        row = await self._inventory.get_by_order(order_id)
        if not row:
            row = OrderInventory(order_id=order_id, expected_count=0, received_count=0)
            await self._inventory.upsert(row)
        return row

    async def update_inventory(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        *,
        expected_count: int,
        received_count: int,
        missing_notes: str | None,
        damaged_notes: str | None,
    ) -> OrderInventory:
        laundry = await self._laundry_for_partner(partner_user_id)
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        row = await self._inventory.get_by_order(order_id)
        if not row:
            row = OrderInventory(order_id=order_id)
        row.expected_count = expected_count
        row.received_count = received_count
        row.missing_notes = missing_notes
        row.damaged_notes = damaged_notes
        saved = await self._inventory.upsert(row)
        if received_count < expected_count or missing_notes or damaged_notes:
            await FraudDetectionService(self._session).on_inventory_mismatch(laundry.id, order_id)
        return saved

    async def list_staff(self, partner_user_id: UUID) -> list[PartnerStaff]:
        laundry = await self._laundry_for_partner(partner_user_id)
        return await self._staff.list_by_laundry(laundry.id)

    async def create_staff(
        self,
        partner_user_id: UUID,
        *,
        name: str,
        phone: str | None,
        role,
    ) -> PartnerStaff:
        laundry = await self._laundry_for_partner(partner_user_id)
        staff = PartnerStaff(laundry_id=laundry.id, name=name, phone=phone, role=role)
        return await self._staff.create(staff)

    async def delete_staff(self, partner_user_id: UUID, staff_id: UUID) -> None:
        laundry = await self._laundry_for_partner(partner_user_id)
        staff = await self._staff.get_by_id(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        await self._staff.soft_delete(staff)

    async def analytics_summary(self, partner_user_id: UUID) -> dict:
        laundry = await self._laundry_for_partner(partner_user_id)
        pending_statuses = (OrderStatus.confirmed, OrderStatus.pickup_assigned)
        in_progress = (
            OrderStatus.picked_up,
            OrderStatus.washing,
            OrderStatus.ironing,
            OrderStatus.ready,
            OrderStatus.out_for_delivery,
        )

        async def count_where(*statuses: OrderStatus) -> int:
            result = await self._session.execute(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry.id,
                    Order.deleted_at.is_(None),
                    Order.status.in_(statuses),
                ),
            )
            return int(result.scalar() or 0)

        all_result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.laundry_id == laundry.id, Order.deleted_at.is_(None)),
        )
        total = int(all_result.scalar() or 0)

        revenue_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
            ),
        )
        revenue = Decimal(str(revenue_result.scalar() or 0))

        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.created_at >= month_start,
            ),
        )
        revenue_month = Decimal(str(month_result.scalar() or 0))

        customers_result = await self._session.execute(
            select(func.count(func.distinct(Order.user_id))).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
            ),
        )
        customers_count = int(customers_result.scalar() or 0)

        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())

        today_orders_result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.created_at >= today_start,
            ),
        )
        orders_today = int(today_orders_result.scalar() or 0)

        today_revenue_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.updated_at >= today_start,
            ),
        )
        revenue_today = Decimal(str(today_revenue_result.scalar() or 0))

        week_revenue_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.updated_at >= week_start,
            ),
        )
        revenue_week = Decimal(str(week_revenue_result.scalar() or 0))

        return {
            "laundry_id": laundry.id,
            "laundry_name": laundry.name,
            "avg_rating": str(laundry.avg_rating.quantize(Decimal("0.01"))),
            "review_count": laundry.review_count,
            "orders_total": total,
            "orders_today": orders_today,
            "orders_pending": await count_where(*pending_statuses),
            "orders_in_progress": await count_where(*in_progress),
            "orders_ready": await count_where(OrderStatus.ready),
            "pickup_requests": await count_where(OrderStatus.confirmed),
            "orders_delivered": await count_where(OrderStatus.delivered),
            "customers_count": customers_count,
            "revenue_inr": str(revenue.quantize(Decimal("0.01"))),
            "revenue_today_inr": str(revenue_today.quantize(Decimal("0.01"))),
            "revenue_this_month_inr": str(revenue_month.quantize(Decimal("0.01"))),
            "revenue_week_inr": str(revenue_week.quantize(Decimal("0.01"))),
        }

    async def list_customers(self, partner_user_id: UUID) -> list[dict]:
        laundry_ids = await self._laundry_ids_for_partner(partner_user_id)
        result = await self._session.execute(
            select(
                Order.user_id,
                User.full_name,
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.total_inr), 0).label("total_spent"),
                func.max(Order.created_at).label("last_order_at"),
            )
            .join(User, User.id == Order.user_id)
            .where(Order.laundry_id.in_(laundry_ids), Order.deleted_at.is_(None))
            .group_by(Order.user_id, User.full_name)
            .order_by(func.max(Order.created_at).desc()),
        )
        rows = []
        for row in result.all():
            total = Decimal(str(row.total_spent or 0)).quantize(Decimal("0.01"))
            last_at = row.last_order_at
            rows.append(
                {
                    "user_id": row.user_id,
                    "name": row.full_name,
                    "order_count": int(row.order_count),
                    "total_spent_inr": str(total),
                    "last_order_at": last_at.isoformat() if last_at else None,
                },
            )
        return rows

    async def list_orders_for_partner(self, partner_user_id: UUID) -> list[tuple[Order, str]]:
        laundry_ids = await self._laundry_ids_for_partner(partner_user_id)
        result = await self._session.execute(
            select(Order, User.full_name)
            .outerjoin(User, User.id == Order.user_id)
            .where(Order.laundry_id.in_(laundry_ids), Order.deleted_at.is_(None))
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(50),
        )
        rows: list[tuple[Order, str]] = []
        for order, user_name in result.all():
            display_name = user_name or order.customer_name or "Walk-in customer"
            rows.append((order, display_name))
        return rows
