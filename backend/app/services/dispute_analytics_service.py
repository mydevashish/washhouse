"""Dispute analytics business logic."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dispute_analytics_repository import DisputeAnalyticsRepository
from app.schemas.revenue_analytics import RevenuePeriod
from app.services.revenue_analytics_service import resolve_date_range


class DisputeAnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = DisputeAnalyticsRepository(session)

    async def dashboard(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        start, end, _, _, label = resolve_date_range(period, date_from, date_to)
        overview = await self._repo.overview(start, end)
        overview["period_label"] = label
        overview["date_from"] = start
        overview["date_to"] = end
        return {
            "overview": overview,
            "top_dispute_types": await self._repo.top_dispute_types(start, end),
            "high_risk_customers": await self._repo.high_risk_customers(start, end),
            "high_risk_laundries": await self._repo.high_risk_laundries(start, end),
        }

    async def charts(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        start, end, _, _, _ = resolve_date_range(period, date_from, date_to)
        return {
            "disputes_by_laundry": await self._repo.chart_by_laundry(start, end),
            "disputes_by_customer": await self._repo.chart_by_customer(start, end),
            "disputes_by_type": await self._repo.chart_by_type(start, end),
            "disputes_by_region": await self._repo.chart_by_region(start, end),
            "monthly_trend": await self._repo.monthly_trend(start, end),
        }

    async def export_csv(
        self,
        *,
        period: RevenuePeriod = RevenuePeriod.last_30_days,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> str:
        dash = await self.dashboard(period=period, date_from=date_from, date_to=date_to)
        charts = await self.charts(period=period, date_from=date_from, date_to=date_to)
        buf = io.StringIO()
        writer = csv.writer(buf)

        ov = dash["overview"]
        writer.writerow(["Dispute Analytics Report"])
        writer.writerow(["Period", ov["period_label"]])
        writer.writerow(["From", ov["date_from"].isoformat()])
        writer.writerow(["To", ov["date_to"].isoformat()])
        writer.writerow([])

        writer.writerow(["Overview"])
        writer.writerow(["Open Disputes", ov["open_disputes"]])
        writer.writerow(["Resolved Disputes", ov["resolved_disputes"]])
        writer.writerow(["Avg Resolution (hours)", ov["avg_resolution_hours"]])
        writer.writerow(["Dispute Rate %", ov["dispute_rate_pct"]])
        writer.writerow(["Refund Amount (INR)", ov["refund_amount_inr"]])
        writer.writerow(["Total Disputes (period)", ov["total_disputes_period"]])
        writer.writerow(["Total Orders (period)", ov["total_orders_period"]])
        writer.writerow([])

        writer.writerow(["Top Dispute Types"])
        writer.writerow(["Type", "Count", "Share"])
        for row in dash["top_dispute_types"]:
            writer.writerow([row["type_label"], row["count"], row["pct"]])
        writer.writerow([])

        writer.writerow(["High Risk Customers"])
        writer.writerow(["Name", "Email", "Risk", "Trust Score", "Disputes", "Refund Rate"])
        for row in dash["high_risk_customers"]:
            writer.writerow(
                [
                    row["full_name"],
                    row["email"] or "",
                    row["risk_label"],
                    row["trust_score"],
                    row["dispute_count"],
                    row["refund_rate_pct"],
                ],
            )
        writer.writerow([])

        writer.writerow(["High Risk Laundries"])
        writer.writerow(["Name", "City", "State", "Risk", "Trust Score", "Complaints", "Complaint Rate"])
        for row in dash["high_risk_laundries"]:
            writer.writerow(
                [
                    row["laundry_name"],
                    row["city"],
                    row["state"],
                    row["risk_label"],
                    row["trust_score"],
                    row["complaint_count"],
                    row["complaint_rate_pct"],
                ],
            )
        writer.writerow([])

        writer.writerow(["Disputes by Laundry"])
        writer.writerow(["Laundry", "Count"])
        for row in charts["disputes_by_laundry"]:
            writer.writerow([row["label"], row["value"]])
        writer.writerow([])

        writer.writerow(["Disputes by Customer"])
        writer.writerow(["Customer", "Count"])
        for row in charts["disputes_by_customer"]:
            writer.writerow([row["label"], row["value"]])
        writer.writerow([])

        writer.writerow(["Disputes by Type"])
        writer.writerow(["Type", "Count"])
        for row in charts["disputes_by_type"]:
            writer.writerow([row["label"], row["value"]])
        writer.writerow([])

        writer.writerow(["Disputes by Region"])
        writer.writerow(["Region", "Count"])
        for row in charts["disputes_by_region"]:
            writer.writerow([row["label"], row["value"]])
        writer.writerow([])

        writer.writerow(["Monthly Trend"])
        writer.writerow(["Month", "Disputes", "Resolved", "Refund Amount (INR)"])
        for row in charts["monthly_trend"]:
            writer.writerow([row["month"], row["disputes"], row["resolved"], row["refund_amount_inr"]])

        return buf.getvalue()
