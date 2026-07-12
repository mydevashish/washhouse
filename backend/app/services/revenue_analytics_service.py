"""Laundry-wise revenue analytics business logic."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.revenue_analytics_repository import RevenueAnalyticsRepository
from app.schemas.revenue_analytics import RevenuePeriod

# Indian city → state mapping for location filters and display
CITY_STATE_MAP: dict[str, str] = {
    "Bengaluru": "Karnataka",
    "Mumbai": "Maharashtra",
    "Hyderabad": "Telangana",
    "Chennai": "Tamil Nadu",
    "Pune": "Maharashtra",
    "Delhi": "Delhi",
    "Kolkata": "West Bengal",
    "Mysuru": "Karnataka",
    "Koramangala": "Karnataka",
    "Indiranagar": "Karnataka",
    "HSR Layout": "Karnataka",
}

PERIOD_LABELS: dict[RevenuePeriod, str] = {
    RevenuePeriod.today: "Today",
    RevenuePeriod.yesterday: "Yesterday",
    RevenuePeriod.last_7_days: "Last 7 days",
    RevenuePeriod.last_30_days: "Last 30 days",
    RevenuePeriod.this_month: "This month",
    RevenuePeriod.last_month: "Last month",
    RevenuePeriod.custom: "Custom range",
}


def resolve_date_range(
    period: RevenuePeriod,
    date_from: datetime | None,
    date_to: datetime | None,
) -> tuple[datetime, datetime, datetime, datetime, str]:
    """Return (start, end, prev_start, prev_end, label)."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    if period == RevenuePeriod.today:
        start, end = today_start, today_end
        delta = timedelta(days=1)
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end - delta + timedelta(microseconds=1)
    elif period == RevenuePeriod.yesterday:
        end = today_start - timedelta(microseconds=1)
        start = today_start - timedelta(days=1)
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end - timedelta(days=1) + timedelta(microseconds=1)
    elif period == RevenuePeriod.last_7_days:
        end = today_end
        start = today_start - timedelta(days=6)
        delta = end - start
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end - delta
    elif period == RevenuePeriod.last_30_days:
        end = today_end
        start = today_start - timedelta(days=29)
        delta = end - start
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end - delta
    elif period == RevenuePeriod.this_month:
        start = today_start.replace(day=1)
        end = today_end
        prev_month_end = start - timedelta(microseconds=1)
        prev_start = prev_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_end = prev_month_end
    elif period == RevenuePeriod.last_month:
        this_month_start = today_start.replace(day=1)
        end = this_month_start - timedelta(microseconds=1)
        start = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        if not date_from or not date_to:
            end = today_end
            start = today_start - timedelta(days=29)
        else:
            start = date_from if date_from.tzinfo else date_from.replace(tzinfo=UTC)
            end = date_to if date_to.tzinfo else date_to.replace(tzinfo=UTC)
        delta = end - start
        prev_end = start - timedelta(microseconds=1)
        prev_start = prev_end - delta

    label = PERIOD_LABELS.get(period, "Custom range")
    return start, end, prev_start, prev_end, label


def _state_for_city(city: str) -> str:
    for key, state in CITY_STATE_MAP.items():
        if key.lower() in city.lower():
            return state
    return "India"


def _cities_for_state(state: str) -> list[str] | None:
    if not state:
        return None
    matches = [city for city, st in CITY_STATE_MAP.items() if st.lower() == state.lower()]
    return matches or None


def _growth_pct(current: Decimal, previous: Decimal) -> str:
    if previous <= 0:
        return "+100" if current > 0 else "0"
    pct = ((current - previous) / previous * Decimal("100")).quantize(Decimal("0.1"))
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct}"


def _money(val: Decimal) -> str:
    return str(val.quantize(Decimal("0.01")))


class RevenueAnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = RevenueAnalyticsRepository(session)

    async def _overview_dict(
        self,
        start: datetime,
        end: datetime,
        label: str,
    ) -> dict:
        raw = await self._repo.platform_overview(start, end)
        delivered = raw["delivered_orders"]
        return {
            "total_platform_revenue_inr": _money(raw["revenue"]),
            "platform_commission_inr": _money(raw["commission"]),
            "total_orders": raw["total_orders"],
            "delivered_orders": delivered,
            "average_order_value_inr": _money(raw["aov"]),
            "active_laundries": raw["active_laundries"],
            "top_laundry_name": raw["top_laundry_name"],
            "top_laundry_revenue_inr": _money(raw["top_laundry_revenue"])
            if raw["top_laundry_revenue"] is not None
            else None,
            "period_label": label,
            "date_from": start,
            "date_to": end,
        }

    def _commission_dict(self, raw: dict) -> dict:
        return {
            "total_laundry_revenue_inr": _money(raw["revenue"]),
            "average_commission_pct": _money(raw["avg_rate"]),
            "total_commission_earned_inr": _money(raw["commission"]),
            "total_net_partner_earnings_inr": _money(raw["net_earnings"]),
            "pending_settlements_inr": _money(raw["pending_settlements"]),
            "completed_settlements_inr": _money(raw["completed_settlements"]),
        }

    def _refund_dict(self, raw: dict) -> dict:
        return {
            "refund_amount_inr": _money(raw["refund_amount"]),
            "refund_count": raw["refund_count"],
            "refund_pct": _money(raw["refund_pct"]),
            "by_reason": [
                {
                    "reason": r["reason"],
                    "count": r["count"],
                    "amount_inr": _money(r["amount"]),
                }
                for r in raw["by_reason"]
            ],
            "by_laundry": [
                {
                    "label": r["label"],
                    "value": _money(r["value"]),
                    "orders": r["orders"],
                }
                for r in raw["by_laundry"]
            ],
        }

    def _dispute_dict(self, raw: dict) -> dict:
        return {
            "open_disputes": raw["open_disputes"],
            "resolved_disputes": raw["resolved_disputes"],
            "dispute_rate_pct": _money(raw["dispute_rate_pct"]),
            "common_issues": [
                {
                    "label": r["label"],
                    "value": _money(r["value"]),
                    "orders": r["orders"],
                }
                for r in raw["common_issues"]
            ],
        }

    async def _build_insights(
        self,
        start: datetime,
        end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        overview: dict,
    ) -> list[dict]:
        insights: list[dict] = []
        total_rev = Decimal(overview["total_platform_revenue_inr"])
        top_name = overview.get("top_laundry_name")
        top_rev_str = overview.get("top_laundry_revenue_inr")
        if top_name and top_rev_str and total_rev > 0:
            top_rev = Decimal(top_rev_str)
            share = (top_rev / total_rev * Decimal("100")).quantize(Decimal("0.1"))
            insights.append(
                {
                    "text": f"{top_name} generated {share}% of platform revenue in {overview['period_label'].lower()}.",
                    "severity": "info",
                },
            )

        rows, _ = await self._repo.laundry_aggregates(
            start, end, page=1, page_size=5, sort_by="revenue",
        )
        for row in rows[:3]:
            prev_rev = await self._repo.laundry_revenue_for_period(
                row["laundry_id"], prev_start, prev_end,
            )
            growth = _growth_pct(row["revenue"], prev_rev)
            if prev_rev > 0 and Decimal(growth.replace("+", "")) >= Decimal("10"):
                insights.append(
                    {
                        "text": f"{row['laundry_name']} revenue increased {growth}% compared to the previous period.",
                        "severity": "success",
                    },
                )

        dispute_rows, _ = await self._repo.laundry_aggregates(
            start, end, page=1, page_size=100, sort_by="disputes",
        )
        if dispute_rows and dispute_rows[0]["disputes_count"] > 0:
            top_d = dispute_rows[0]
            if top_d["orders_count"] > 0:
                rate = (
                    Decimal(top_d["disputes_count"])
                    / Decimal(top_d["orders_count"])
                    * Decimal("100")
                ).quantize(Decimal("0.1"))
                if rate >= Decimal("5"):
                    insights.append(
                        {
                            "text": f"{top_d['laundry_name']} has the highest dispute rate ({rate}%).",
                            "severity": "warning",
                        },
                    )

        if not insights:
            insights.append(
                {
                    "text": "Revenue analytics loaded. Adjust filters to explore laundry performance.",
                    "severity": "info",
                },
            )
        return insights

    async def _leaderboard(
        self,
        start: datetime,
        end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        *,
        limit: int = 10,
    ) -> list[dict]:
        rows, _ = await self._repo.laundry_aggregates(
            start, end, page=1, page_size=limit, sort_by="revenue",
        )
        result = []
        for i, row in enumerate(rows, start=1):
            prev_rev = await self._repo.laundry_revenue_for_period(
                row["laundry_id"], prev_start, prev_end,
            )
            result.append(
                {
                    "rank": i,
                    "laundry_id": row["laundry_id"],
                    "laundry_name": row["laundry_name"],
                    "partner_name": row["partner_name"],
                    "city": row["city"],
                    "revenue_inr": _money(row["revenue"]),
                    "orders_count": row["orders_count"],
                    "growth_pct": _growth_pct(row["revenue"], prev_rev),
                    "commission_inr": _money(row["commission"]),
                },
            )
        return result

    async def dashboard(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        start, end, prev_start, prev_end, label = resolve_date_range(period, date_from, date_to)
        overview = await self._overview_dict(start, end, label)
        commission = self._commission_dict(await self._repo.commission_block(start, end))
        refunds = self._refund_dict(await self._repo.refund_block(start, end))
        disputes = self._dispute_dict(await self._repo.dispute_block(start, end))
        insights = await self._build_insights(start, end, prev_start, prev_end, overview)
        top_laundries = await self._leaderboard(start, end, prev_start, prev_end, limit=5)
        return {
            "overview": overview,
            "insights": insights,
            "top_laundries": top_laundries,
            "commission": commission,
            "refunds": refunds,
            "disputes": disputes,
        }

    async def list_laundries(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        city: str | None = None,
        state: str | None = None,
        status: str | None = None,
        revenue_min: Decimal | None = None,
        revenue_max: Decimal | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "revenue",
        sort_dir: str = "desc",
    ) -> dict:
        start, end, prev_start, prev_end, _ = resolve_date_range(period, date_from, date_to)
        cities = _cities_for_state(state) if state else None
        rows, total = await self._repo.laundry_aggregates(
            start,
            end,
            laundry_id=laundry_id,
            partner_id=partner_id,
            city=city,
            status=status,
            revenue_min=revenue_min,
            revenue_max=revenue_max,
            cities_for_state=cities,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        items = []
        for row in rows:
            prev_rev = await self._repo.laundry_revenue_for_period(
                row["laundry_id"], prev_start, prev_end,
            )
            items.append(
                {
                    "laundry_id": row["laundry_id"],
                    "laundry_name": row["laundry_name"],
                    "partner_id": row["partner_id"],
                    "partner_name": row["partner_name"],
                    "city": row["city"],
                    "state": _state_for_city(row["city"]),
                    "orders_count": row["orders_count"],
                    "revenue_inr": _money(row["revenue"]),
                    "commission_inr": _money(row["commission"]),
                    "net_payout_inr": _money(row["net_payout"]),
                    "refund_amount_inr": _money(row["refund_amount"]),
                    "disputes_count": row["disputes_count"],
                    "average_rating": _money(row["average_rating"]),
                    "status": row["status"],
                    "growth_pct": _growth_pct(row["revenue"], prev_rev),
                },
            )
        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def charts(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        start, end, _, _, _ = resolve_date_range(period, date_from, date_to)
        revenue_by = await self._repo.chart_top_laundries(start, end, metric="revenue")
        orders_by = await self._repo.chart_top_laundries(start, end, metric="orders")
        commission_by = await self._repo.chart_top_laundries(start, end, metric="commission")
        growth = await self._repo.daily_revenue_trend(start, end)
        monthly = await self._repo.monthly_revenue_trend(start, end)

        def chart_points(rows: list[dict]) -> list[dict]:
            return [
                {"label": r["label"], "value": _money(r["value"]), "orders": r.get("orders", 0)}
                for r in rows
            ]

        return {
            "revenue_by_laundry": chart_points(revenue_by),
            "orders_by_laundry": chart_points(orders_by),
            "commission_by_laundry": chart_points(commission_by),
            "revenue_growth": chart_points(growth),
            "monthly_trend": [
                {
                    "month": m["month"],
                    "revenue_inr": _money(m["revenue"]),
                    "orders": m["orders"],
                    "commission_inr": _money(m["commission"]),
                }
                for m in monthly
            ],
        }

    async def laundry_detail(
        self,
        laundry_id: UUID,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        meta = await self._repo.get_laundry_meta(laundry_id)
        if not meta:
            raise NotFoundError("Laundry not found")

        start, end, prev_start, prev_end, label = resolve_date_range(period, date_from, date_to)
        rows, _ = await self._repo.laundry_aggregates(
            start, end, laundry_id=laundry_id, page=1, page_size=1,
        )
        row = rows[0] if rows else None
        revenue = row["revenue"] if row else Decimal("0")
        commission_val = row["commission"] if row else Decimal("0")
        orders_count = row["orders_count"] if row else 0
        delivered = orders_count  # revenue already scoped to delivered orders in aggregate
        aov = (revenue / delivered).quantize(Decimal("0.01")) if delivered and revenue > 0 else Decimal("0")

        overview = {
            "total_platform_revenue_inr": _money(revenue),
            "platform_commission_inr": _money(commission_val),
            "total_orders": orders_count,
            "delivered_orders": delivered,
            "average_order_value_inr": _money(aov),
            "active_laundries": 1,
            "top_laundry_name": meta["laundry_name"],
            "top_laundry_revenue_inr": _money(revenue),
            "period_label": label,
            "date_from": start,
            "date_to": end,
        }

        commission = self._commission_dict(
            await self._repo.commission_block(start, end, laundry_id=laundry_id),
        )
        refunds = self._refund_dict(
            await self._repo.refund_block(start, end, laundry_id=laundry_id),
        )
        disputes = self._dispute_dict(
            await self._repo.dispute_block(start, end, laundry_id=laundry_id),
        )
        monthly = await self._repo.monthly_revenue_trend(start, end, laundry_id=laundry_id)

        partner_branches = None
        branch_count = await self._repo.count_partner_laundries(meta["partner_id"])
        if branch_count > 1:
            branches_raw = await self._repo.partner_branches(meta["partner_id"], start, end)
            branches = []
            total_rev = Decimal("0")
            total_orders = 0
            total_comm = Decimal("0")
            for b in branches_raw:
                prev_rev = await self._repo.laundry_revenue_for_period(
                    b["laundry_id"], prev_start, prev_end,
                )
                total_rev += b["revenue"]
                total_orders += b["orders_count"]
                total_comm += b["commission"]
                branches.append(
                    {
                        "laundry_id": b["laundry_id"],
                        "laundry_name": b["laundry_name"],
                        "city": b["city"],
                        "revenue_inr": _money(b["revenue"]),
                        "orders_count": b["orders_count"],
                        "commission_inr": _money(b["commission"]),
                        "net_payout_inr": _money(b["net_payout"]),
                        "growth_pct": _growth_pct(b["revenue"], prev_rev),
                    },
                )
            partner_branches = {
                "partner_id": meta["partner_id"],
                "partner_name": meta["partner_name"],
                "branch_count": branch_count,
                "total_revenue_inr": _money(total_rev),
                "total_orders": total_orders,
                "total_commission_inr": _money(total_comm),
                "branches": branches,
            }

        rate = meta["commission_rate"]
        return {
            "laundry_id": meta["laundry_id"],
            "laundry_name": meta["laundry_name"],
            "partner_id": meta["partner_id"],
            "partner_name": meta["partner_name"],
            "city": meta["city"],
            "state": _state_for_city(meta["city"]),
            "status": meta["status"],
            "average_rating": _money(meta["average_rating"]),
            "commission_rate": _money(rate) if rate is not None else "10.00",
            "overview": overview,
            "commission": commission,
            "refunds": refunds,
            "disputes": disputes,
            "monthly_trend": [
                {
                    "month": m["month"],
                    "revenue_inr": _money(m["revenue"]),
                    "orders": m["orders"],
                    "commission_inr": _money(m["commission"]),
                }
                for m in monthly
            ],
            "partner_branches": partner_branches,
        }

    async def export_csv(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        city: str | None = None,
        state: str | None = None,
        status: str | None = None,
    ) -> str:
        data = await self.list_laundries(
            period=period,
            date_from=date_from,
            date_to=date_to,
            laundry_id=laundry_id,
            partner_id=partner_id,
            city=city,
            state=state,
            status=status,
            page=1,
            page_size=10_000,
        )
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "Laundry Name",
                "Partner Name",
                "City",
                "State",
                "Orders",
                "Revenue (INR)",
                "Commission (INR)",
                "Net Payout (INR)",
                "Refunds (INR)",
                "Disputes",
                "Rating",
                "Status",
                "Growth %",
            ],
        )
        for row in data["items"]:
            writer.writerow(
                [
                    row["laundry_name"],
                    row["partner_name"],
                    row["city"],
                    row["state"],
                    row["orders_count"],
                    row["revenue_inr"],
                    row["commission_inr"],
                    row["net_payout_inr"],
                    row["refund_amount_inr"],
                    row["disputes_count"],
                    row["average_rating"],
                    row["status"],
                    row["growth_pct"],
                ],
            )
        return buf.getvalue()
