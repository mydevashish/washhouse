"""Executive business health metrics persistence."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import (
    ComplaintStatus,
    ComplaintType,
    LaundryStatus,
    OrderStatus,
    PaymentStatus,
    SettlementStatus,
    TaskAssignmentStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.order_task_assignment import OrderTaskAssignment
from app.models.settlement import Settlement
from app.models.user import User

_OPEN_DISPUTES = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)

_PENDING_SETTLEMENTS = (
    SettlementStatus.pending,
    SettlementStatus.approved,
    SettlementStatus.processing,
)


def _month_start(base: datetime, offset: int) -> datetime:
    """First day of month `offset` months from `base` (base must be day=1)."""
    month_index = (base.year * 12 + base.month - 1) + offset
    year, month = divmod(month_index, 12)
    return base.replace(year=year, month=month + 1, day=1)


class BusinessHealthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def revenue_sum(
        self,
        *,
        since: datetime | None = None,
        until: datetime | None = None,
        use_delivered_at: bool = True,
    ) -> Decimal:
        col = Order.delivered_at if use_delivered_at else Order.created_at
        q = select(func.coalesce(func.sum(Order.total_inr), 0)).where(
            Order.deleted_at.is_(None),
            Order.status == OrderStatus.delivered,
        )
        if since:
            q = q.where(col >= since)
        if until:
            q = q.where(col < until)
        return Decimal(str(await self._session.scalar(q) or 0))

    async def orders_count(
        self,
        *,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> int:
        q = select(func.count()).select_from(Order).where(Order.deleted_at.is_(None))
        if since:
            q = q.where(Order.created_at >= since)
        if until:
            q = q.where(Order.created_at < until)
        return int(await self._session.scalar(q) or 0)

    async def delivered_count(
        self,
        *,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> int:
        q = select(func.count()).select_from(Order).where(
            Order.deleted_at.is_(None),
            Order.status == OrderStatus.delivered,
        )
        if since:
            q = q.where(Order.delivered_at.isnot(None), Order.delivered_at >= since)
        if until:
            q = q.where(Order.delivered_at < until)
        return int(await self._session.scalar(q) or 0)

    async def active_customers(self, since: datetime) -> int:
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(Order.user_id)))
                .select_from(Order)
                .where(Order.deleted_at.is_(None), Order.created_at >= since),
            )
            or 0,
        )

    async def active_laundries(self, since: datetime) -> int:
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(Order.laundry_id)))
                .select_from(Order)
                .join(Laundry, Laundry.id == Order.laundry_id)
                .where(
                    Order.deleted_at.is_(None),
                    Order.created_at >= since,
                    Laundry.status == LaundryStatus.approved,
                    Laundry.deleted_at.is_(None),
                ),
            )
            or 0,
        )

    async def new_customers(self, since: datetime, until: datetime | None = None) -> int:
        q = select(func.count()).select_from(User).where(
            User.deleted_at.is_(None),
            User.role == UserRole.customer,
            User.created_at >= since,
        )
        if until:
            q = q.where(User.created_at < until)
        return int(await self._session.scalar(q) or 0)

    async def new_laundries(self, since: datetime, until: datetime | None = None) -> int:
        q = select(func.count()).select_from(Laundry).where(
            Laundry.deleted_at.is_(None),
            Laundry.created_at >= since,
        )
        if until:
            q = q.where(Laundry.created_at < until)
        return int(await self._session.scalar(q) or 0)

    async def open_disputes(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count()).select_from(Complaint).where(Complaint.status.in_(_OPEN_DISPUTES)),
            )
            or 0,
        )

    async def pending_refunds(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Complaint)
                .where(
                    Complaint.complaint_type == ComplaintType.refund_request,
                    Complaint.status.in_(_OPEN_DISPUTES),
                ),
            )
            or 0,
        )

    async def pending_settlements(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Settlement)
                .where(Settlement.status.in_(_PENDING_SETTLEMENTS)),
            )
            or 0,
        )

    async def delayed_settlements(self, older_than: datetime) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Settlement)
                .where(
                    Settlement.status.in_((SettlementStatus.pending, SettlementStatus.approved)),
                    Settlement.created_at < older_than,
                ),
            )
            or 0,
        )

    async def failed_deliveries(self, since: datetime | None = None) -> int:
        q = select(func.count()).select_from(OrderTaskAssignment).where(
            OrderTaskAssignment.status == TaskAssignmentStatus.failed,
        )
        if since:
            q = q.where(OrderTaskAssignment.completed_at.isnot(None), OrderTaskAssignment.completed_at >= since)
        return int(await self._session.scalar(q) or 0)

    async def delayed_orders(self, now: datetime) -> int:
        pickup_delayed = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.confirmed, OrderStatus.pickup_assigned)),
                Order.pickup_at < now,
            ),
        )
        delivery_delayed = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.ready, OrderStatus.out_for_delivery)),
                Order.delivery_at < now,
            ),
        )
        return int(pickup_delayed or 0) + int(delivery_delayed or 0)

    async def refund_rate(self, since: datetime) -> tuple[int, int]:
        refunded = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.deleted_at.is_(None),
                    Order.payment_status == PaymentStatus.refunded,
                    Order.updated_at >= since,
                ),
            )
            or 0,
        )
        delivered = await self.delivered_count(since=since)
        return refunded, delivered

    async def dispute_rate(self, since: datetime) -> tuple[int, int]:
        disputes = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Complaint)
                .where(Complaint.created_at >= since),
            )
            or 0,
        )
        orders = await self.orders_count(since=since)
        return disputes, orders

    async def approved_laundries_count(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Laundry)
                .where(Laundry.status == LaundryStatus.approved, Laundry.deleted_at.is_(None)),
            )
            or 0,
        )

    async def total_customers(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(User)
                .where(User.deleted_at.is_(None), User.role == UserRole.customer),
            )
            or 0,
        )

    async def daily_revenue_trend(self, days: int = 14) -> list[dict]:
        start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        rows = await self._session.execute(
            select(
                func.date(Order.delivered_at).label("day"),
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
            )
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.delivered_at.isnot(None),
                Order.delivered_at >= start,
            )
            .group_by(func.date(Order.delivered_at))
            .order_by(func.date(Order.delivered_at)),
        )
        by_day = {str(r[0]): (Decimal(str(r[1])), int(r[2])) for r in rows.all()}
        trend = []
        for i in range(days):
            day = (start + timedelta(days=i)).date()
            rev, cnt = by_day.get(str(day), (Decimal("0"), 0))
            trend.append({"date": day.isoformat(), "revenue_inr": str(rev.quantize(Decimal("0.01"))), "orders": cnt})
        return trend

    async def returning_customers(self, since: datetime) -> int:
        subq = (
            select(Order.user_id)
            .where(Order.deleted_at.is_(None), Order.created_at >= since)
            .group_by(Order.user_id)
            .having(func.count(Order.id) >= 2)
            .subquery()
        )
        return int(await self._session.scalar(select(func.count()).select_from(subq)) or 0)

    async def laundry_revenue_rankings(self, since: datetime) -> tuple[dict | None, dict | None]:
        rows = await self._session.execute(
            select(
                Laundry.name,
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
            )
            .join(Laundry, Laundry.id == Order.laundry_id)
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.delivered_at.isnot(None),
                Order.delivered_at >= since,
                Laundry.deleted_at.is_(None),
                Laundry.status == LaundryStatus.approved,
            )
            .group_by(Laundry.id, Laundry.name)
            .having(func.count(Order.id) >= 1)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc()),
        )
        ranked = [
            {
                "name": name,
                "revenue_inr": str(Decimal(str(rev or 0)).quantize(Decimal("0.01"))),
                "orders": int(cnt),
            }
            for name, rev, cnt in rows.all()
        ]
        if not ranked:
            return None, None
        top = ranked[0]
        lowest = ranked[-1] if len(ranked) > 1 else ranked[0]
        return top, lowest

    async def monthly_signups(self, months: int = 6) -> tuple[list[dict], list[dict]]:
        now = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        customer_points: list[dict] = []
        laundry_points: list[dict] = []
        for i in range(months - 1, -1, -1):
            month_start = _month_start(now, -i)
            month_end = _month_start(now, -i + 1)
            month_label = month_start.strftime("%Y-%m")
            customer_points.append(
                {"month": month_label, "count": await self.new_customers(month_start, month_end)},
            )
            laundry_points.append(
                {"month": month_label, "count": await self.new_laundries(month_start, month_end)},
            )
        return customer_points, laundry_points

    async def daily_commission_trend(self, days: int = 14) -> list[dict]:
        start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        rows = await self._session.execute(
            select(
                func.date(Order.delivered_at).label("day"),
                func.coalesce(func.sum(Order.total_inr * Order.commission_rate / 100), 0),
            )
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.delivered_at.isnot(None),
                Order.delivered_at >= start,
            )
            .group_by(func.date(Order.delivered_at))
            .order_by(func.date(Order.delivered_at)),
        )
        by_day = {str(r[0]): Decimal(str(r[1] or 0)) for r in rows.all()}
        trend = []
        for i in range(days):
            day = (start + timedelta(days=i)).date()
            commission = by_day.get(str(day), Decimal("0"))
            trend.append(
                {
                    "date": day.isoformat(),
                    "value": float(commission.quantize(Decimal("0.01"))),
                    "label": None,
                },
            )
        return trend

    async def daily_orders_trend(self, days: int = 14) -> list[dict]:
        start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        rows = await self._session.execute(
            select(func.date(Order.created_at).label("day"), func.count(Order.id))
            .where(Order.deleted_at.is_(None), Order.created_at >= start)
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at)),
        )
        by_day = {str(r[0]): int(r[1]) for r in rows.all()}
        trend = []
        for i in range(days):
            day = (start + timedelta(days=i)).date()
            trend.append({"date": day.isoformat(), "value": float(by_day.get(str(day), 0)), "label": None})
        return trend
