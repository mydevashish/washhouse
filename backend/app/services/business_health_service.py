"""Executive business health dashboard logic."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.business_health import BusinessHealthRepository

# Alert thresholds (executive defaults)
REFUND_RATE_WARN = Decimal("5")
DISPUTE_RATE_WARN = Decimal("3")
REVENUE_DROP_WARN = Decimal("-10")
SETTLEMENT_DELAY_DAYS = 7
ACTIVE_WINDOW_DAYS = 90
TREND_DAYS = 14


def _growth_pct(current: Decimal | int, previous: Decimal | int) -> float | None:
    prev = Decimal(str(previous))
    curr = Decimal(str(current))
    if prev == 0:
        return 100.0 if curr > 0 else 0.0
    return round(float((curr - prev) / prev * 100), 1)


def _rate_pct(numerator: int, denominator: int) -> Decimal:
    if denominator == 0:
        return Decimal("0")
    return (Decimal(numerator) / Decimal(denominator) * Decimal("100")).quantize(Decimal("0.01"))


class BusinessHealthService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = BusinessHealthRepository(session)

    async def dashboard(self) -> dict:
        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)
        active_since = now - timedelta(days=ACTIVE_WINDOW_DAYS)
        rate_since = now - timedelta(days=30)
        settlement_cutoff = now - timedelta(days=SETTLEMENT_DELAY_DAYS)

        revenue_today = await self._repo.revenue_sum(since=today_start)
        revenue_month = await self._repo.revenue_sum(since=month_start)
        revenue_prev_month = await self._repo.revenue_sum(since=prev_month_start, until=month_start)
        revenue_growth_pct = _growth_pct(revenue_month, revenue_prev_month)

        orders_today = await self._repo.orders_count(since=today_start)
        orders_month = await self._repo.orders_count(since=month_start)
        orders_prev_month = await self._repo.orders_count(since=prev_month_start, until=month_start)
        delivered_month = await self._repo.delivered_count(since=month_start)
        aov = (revenue_month / delivered_month).quantize(Decimal("0.01")) if delivered_month else Decimal("0")

        active_customers = await self._repo.active_customers(active_since)
        active_laundries = await self._repo.active_laundries(active_since)
        total_customers = await self._repo.total_customers()
        total_laundries = await self._repo.approved_laundries_count()

        new_customers_month = await self._repo.new_customers(month_start)
        new_customers_prev = await self._repo.new_customers(prev_month_start, month_start)
        new_laundries_month = await self._repo.new_laundries(month_start)
        new_laundries_prev = await self._repo.new_laundries(prev_month_start, month_start)
        returning_customers = await self._repo.returning_customers(active_since)
        top_laundry, lowest_laundry = await self._repo.laundry_revenue_rankings(month_start)
        order_growth_pct = _growth_pct(orders_month, orders_prev_month)

        open_disputes = await self._repo.open_disputes()
        pending_refunds = await self._repo.pending_refunds()
        pending_settlements = await self._repo.pending_settlements()
        failed_deliveries = await self._repo.failed_deliveries(since=month_start)
        delayed_orders = await self._repo.delayed_orders(now)
        delayed_settlements = await self._repo.delayed_settlements(settlement_cutoff)

        refunded, delivered_30d = await self._repo.refund_rate(rate_since)
        disputes_30d, orders_30d = await self._repo.dispute_rate(rate_since)
        refund_rate = _rate_pct(refunded, delivered_30d)
        dispute_rate = _rate_pct(disputes_30d, orders_30d)

        alerts = self._build_alerts(
            refund_rate=refund_rate,
            dispute_rate=dispute_rate,
            revenue_growth_pct=revenue_growth_pct,
            delayed_settlements=delayed_settlements,
            pending_settlements=pending_settlements,
            delayed_orders=delayed_orders,
        )

        trend = await self._repo.daily_revenue_trend(TREND_DAYS)
        orders_trend = await self._repo.daily_orders_trend(TREND_DAYS)
        commission_trend = await self._repo.daily_commission_trend(TREND_DAYS)
        customer_growth, laundry_growth = await self._repo.monthly_signups(6)

        revenue_chart = [
            {"date": p["date"], "value": float(p["revenue_inr"]), "label": None}
            for p in trend
        ]

        return {
            "metrics": {
                "revenue_today_inr": str(revenue_today.quantize(Decimal("0.01"))),
                "revenue_month_inr": str(revenue_month.quantize(Decimal("0.01"))),
                "revenue_growth_pct": revenue_growth_pct,
                "orders_today": orders_today,
                "orders_month": orders_month,
                "order_growth_pct": order_growth_pct,
                "average_order_value_inr": str(aov),
                "active_customers": active_customers,
                "new_customers": new_customers_month,
                "returning_customers": returning_customers,
                "active_laundries": active_laundries,
                "top_laundry_name": top_laundry["name"] if top_laundry else None,
                "top_laundry_revenue_inr": top_laundry["revenue_inr"] if top_laundry else None,
                "lowest_laundry_name": lowest_laundry["name"] if lowest_laundry else None,
                "lowest_laundry_revenue_inr": lowest_laundry["revenue_inr"] if lowest_laundry else None,
                "total_customers": total_customers,
                "total_laundries": total_laundries,
            },
            "operational": {
                "open_disputes": open_disputes,
                "pending_refunds": pending_refunds,
                "pending_settlements": pending_settlements,
                "failed_deliveries": failed_deliveries,
                "delayed_orders": delayed_orders,
                "delayed_settlements": delayed_settlements,
            },
            "growth": {
                "customer_growth_pct": _growth_pct(new_customers_month, new_customers_prev),
                "laundry_growth_pct": _growth_pct(new_laundries_month, new_laundries_prev),
                "order_growth_pct": _growth_pct(orders_month, orders_prev_month),
                "revenue_growth_pct": revenue_growth_pct,
                "new_customers_month": new_customers_month,
                "new_laundries_month": new_laundries_month,
            },
            "alerts": alerts,
            "trend": trend,
            "charts": {
                "revenue_trend": revenue_chart,
                "orders_trend": orders_trend,
                "customer_growth": customer_growth,
                "laundry_growth": laundry_growth,
                "commission_trend": commission_trend,
            },
            "generated_at": now.isoformat(),
        }

    def _build_alerts(
        self,
        *,
        refund_rate: Decimal,
        dispute_rate: Decimal,
        revenue_growth_pct: float | None,
        delayed_settlements: int,
        pending_settlements: int,
        delayed_orders: int,
    ) -> list[dict]:
        alerts: list[dict] = []

        if refund_rate >= REFUND_RATE_WARN:
            alerts.append(
                {
                    "id": "high_refund_rate",
                    "severity": "critical" if refund_rate >= REFUND_RATE_WARN * 2 else "warning",
                    "title": "High refund rate",
                    "description": f"Refund rate is {refund_rate}% over the last 30 days (threshold {REFUND_RATE_WARN}%).",
                    "metric_value": f"{refund_rate}%",
                    "href": "/admin/disputes",
                },
            )

        if dispute_rate >= DISPUTE_RATE_WARN:
            alerts.append(
                {
                    "id": "high_dispute_rate",
                    "severity": "critical" if dispute_rate >= DISPUTE_RATE_WARN * 2 else "warning",
                    "title": "High dispute rate",
                    "description": f"Dispute rate is {dispute_rate}% over the last 30 days (threshold {DISPUTE_RATE_WARN}%).",
                    "metric_value": f"{dispute_rate}%",
                    "href": "/admin/disputes",
                },
            )

        if delayed_settlements > 0 or pending_settlements >= 5:
            alerts.append(
                {
                    "id": "settlement_delays",
                    "severity": "warning" if delayed_settlements == 0 else "critical",
                    "title": "Settlement delays",
                    "description": f"{pending_settlements} pending settlements; {delayed_settlements} older than {SETTLEMENT_DELAY_DAYS} days.",
                    "metric_value": str(pending_settlements),
                    "href": "/admin/settlements",
                },
            )

        if revenue_growth_pct is not None and revenue_growth_pct <= float(REVENUE_DROP_WARN):
            alerts.append(
                {
                    "id": "revenue_drop",
                    "severity": "critical" if revenue_growth_pct <= float(REVENUE_DROP_WARN) * 2 else "warning",
                    "title": "Revenue drop",
                    "description": f"Month-over-month revenue is {revenue_growth_pct:+.1f}% vs prior month.",
                    "metric_value": f"{revenue_growth_pct:+.1f}%",
                    "href": "/admin/revenue/analytics",
                },
            )

        if delayed_orders > 0:
            alerts.append(
                {
                    "id": "delayed_orders",
                    "severity": "warning",
                    "title": "Delayed orders",
                    "description": f"{delayed_orders} orders are past their scheduled pickup or delivery window.",
                    "metric_value": str(delayed_orders),
                    "href": "/admin/orders",
                },
            )

        return alerts
