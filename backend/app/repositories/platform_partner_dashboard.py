"""Platform partner dashboard persistence (read-only aggregates)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import LaundryStatus, OrderStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order, OrderItem
from app.models.user import User
from app.repositories.business_health import BusinessHealthRepository, _month_start


def _commission_expr():
    return Order.total_inr * Order.commission_rate / Decimal("100")


class PlatformPartnerDashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._health = BusinessHealthRepository(session)

    async def total_revenue(self) -> Decimal:
        return await self._health.revenue_sum(use_delivered_at=True)

    async def total_commission(self) -> Decimal:
        row = await self._session.scalar(
            select(func.coalesce(func.sum(_commission_expr()), 0)).where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
            ),
        )
        return Decimal(str(row or 0))

    async def top_laundries(self, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(
                Laundry.name,
                Laundry.city,
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
            )
            .join(Laundry, Laundry.id == Order.laundry_id)
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Laundry.deleted_at.is_(None),
            )
            .group_by(Laundry.id, Laundry.name, Laundry.city)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
            .limit(limit),
        )
        return [
            {
                "name": name,
                "city": city,
                "revenue_inr": str(Decimal(str(rev or 0)).quantize(Decimal("0.01"))),
                "orders": int(cnt),
            }
            for name, city, rev, cnt in rows.all()
        ]

    async def top_cities(self, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(
                Laundry.city,
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
            )
            .join(Laundry, Laundry.id == Order.laundry_id)
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Laundry.deleted_at.is_(None),
            )
            .group_by(Laundry.city)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
            .limit(limit),
        )
        return [
            {
                "city": city,
                "revenue_inr": str(Decimal(str(rev or 0)).quantize(Decimal("0.01"))),
                "orders": int(cnt),
            }
            for city, rev, cnt in rows.all()
        ]

    async def top_services(self, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(
                OrderItem.service_name,
                func.coalesce(func.sum(OrderItem.line_total_inr), 0),
                func.coalesce(func.sum(OrderItem.quantity), 0),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
            )
            .group_by(OrderItem.service_name)
            .order_by(func.coalesce(func.sum(OrderItem.line_total_inr), 0).desc())
            .limit(limit),
        )
        return [
            {
                "service_name": name,
                "revenue_inr": str(Decimal(str(rev or 0)).quantize(Decimal("0.01"))),
                "quantity": int(qty or 0),
            }
            for name, rev, qty in rows.all()
        ]

    async def monthly_customer_growth(self, months: int = 6) -> list[dict]:
        now = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        points: list[dict] = []
        for i in range(months - 1, -1, -1):
            month_start = _month_start(now, -i)
            month_end = _month_start(now, -i + 1)
            count = await self._health.new_customers(month_start, month_end)
            points.append({"month": month_start.strftime("%Y-%m"), "count": count})
        return points

    async def monthly_laundry_growth(self, months: int = 6) -> list[dict]:
        now = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        points: list[dict] = []
        for i in range(months - 1, -1, -1):
            month_start = _month_start(now, -i)
            month_end = _month_start(now, -i + 1)
            count = await self._health.new_laundries(month_start, month_end)
            points.append({"month": month_start.strftime("%Y-%m"), "count": count})
        return points

    async def total_orders(self) -> int:
        return await self._health.orders_count()

    async def active_customers(self, since: datetime) -> int:
        return await self._health.active_customers(since)

    async def active_laundries(self, since: datetime) -> int:
        return await self._health.active_laundries(since)

    async def revenue_month(self, month_start: datetime, month_end: datetime | None = None) -> Decimal:
        return await self._health.revenue_sum(since=month_start, until=month_end)

    async def orders_month(self, month_start: datetime, month_end: datetime | None = None) -> int:
        return await self._health.orders_count(since=month_start, until=month_end)

    async def commission_month(self, month_start: datetime, month_end: datetime | None = None) -> Decimal:
        q = select(func.coalesce(func.sum(_commission_expr()), 0)).where(
            Order.deleted_at.is_(None),
            Order.status == OrderStatus.delivered,
            Order.delivered_at.isnot(None),
            Order.delivered_at >= month_start,
        )
        if month_end:
            q = q.where(Order.delivered_at < month_end)
        return Decimal(str(await self._session.scalar(q) or 0))
