"""Platform partner read-only dashboard logic."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.business_health import BusinessHealthRepository
from app.repositories.platform_partner_dashboard import PlatformPartnerDashboardRepository

ACTIVE_WINDOW_DAYS = 90
TREND_DAYS = 14


def _growth_pct(current: Decimal | int, previous: Decimal | int) -> float | None:
    prev = Decimal(str(previous))
    curr = Decimal(str(current))
    if prev == 0:
        return 100.0 if curr > 0 else 0.0
    return round(float((curr - prev) / prev * 100), 1)


class PlatformPartnerDashboardService:
    """Read-only marketplace overview for platform partners — no payouts or edits."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = PlatformPartnerDashboardRepository(session)
        self._health = BusinessHealthRepository(session)

    async def dashboard(self) -> dict:
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)
        active_since = now - timedelta(days=ACTIVE_WINDOW_DAYS)

        total_revenue = await self._repo.total_revenue()
        total_commission = await self._repo.total_commission()
        orders_total = await self._repo.total_orders()
        active_customers = await self._repo.active_customers(active_since)
        active_laundries = await self._repo.active_laundries(active_since)

        revenue_month = await self._repo.revenue_month(month_start)
        revenue_prev = await self._repo.revenue_month(prev_month_start, month_start)
        orders_month = await self._repo.orders_month(month_start)
        orders_prev = await self._repo.orders_month(prev_month_start, month_start)

        trend = await self._health.daily_revenue_trend(TREND_DAYS)
        orders_trend = await self._health.daily_orders_trend(TREND_DAYS)
        customer_growth = await self._repo.monthly_customer_growth(6)
        laundry_growth = await self._repo.monthly_laundry_growth(6)

        return {
            "metrics": {
                "total_revenue_inr": str(total_revenue.quantize(Decimal("0.01"))),
                "platform_commission_inr": str(total_commission.quantize(Decimal("0.01"))),
                "active_customers": active_customers,
                "active_laundries": active_laundries,
                "orders_total": orders_total,
                "revenue_growth_pct": _growth_pct(revenue_month, revenue_prev),
                "orders_growth_pct": _growth_pct(orders_month, orders_prev),
            },
            "charts": {
                "revenue_trend": [
                    {"date": p["date"], "value": float(p["revenue_inr"]), "label": None}
                    for p in trend
                ],
                "orders_trend": orders_trend,
                "customer_growth": customer_growth,
                "laundry_growth": laundry_growth,
            },
            "tables": {
                "top_laundries": await self._repo.top_laundries(limit=10),
                "top_cities": await self._repo.top_cities(limit=10),
                "top_services": await self._repo.top_services(limit=10),
            },
            "generated_at": now.isoformat(),
        }
