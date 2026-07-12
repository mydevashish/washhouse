"""Admin dispute analytics API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.revenue_analytics import ChartDataPoint, RevenuePeriod


class DisputeAnalyticsOverview(BaseModel):
    open_disputes: int
    resolved_disputes: int
    avg_resolution_hours: str
    dispute_rate_pct: str
    refund_amount_inr: str
    total_disputes_period: int
    total_orders_period: int
    period_label: str
    date_from: datetime
    date_to: datetime


class DisputeTypeBreakdown(BaseModel):
    complaint_type: str
    type_label: str
    count: int
    pct: str


class HighRiskCustomerRow(BaseModel):
    user_id: UUID
    full_name: str
    email: str | None
    risk_level: str
    risk_label: str
    trust_score: int
    dispute_count: int
    refund_rate_pct: str


class HighRiskLaundryRow(BaseModel):
    laundry_id: UUID
    laundry_name: str
    city: str
    state: str
    risk_level: str
    risk_label: str
    trust_score: int
    complaint_count: int
    complaint_rate_pct: str


class DisputeMonthlyTrendPoint(BaseModel):
    month: str
    disputes: int
    resolved: int
    refund_amount_inr: str


class DisputeAnalyticsDashboardResponse(BaseModel):
    overview: DisputeAnalyticsOverview
    top_dispute_types: list[DisputeTypeBreakdown]
    high_risk_customers: list[HighRiskCustomerRow]
    high_risk_laundries: list[HighRiskLaundryRow]


class DisputeAnalyticsChartsResponse(BaseModel):
    disputes_by_laundry: list[ChartDataPoint]
    disputes_by_customer: list[ChartDataPoint]
    disputes_by_type: list[ChartDataPoint]
    disputes_by_region: list[ChartDataPoint]
    monthly_trend: list[DisputeMonthlyTrendPoint]


__all__ = [
    "DisputeAnalyticsChartsResponse",
    "DisputeAnalyticsDashboardResponse",
    "DisputeAnalyticsOverview",
    "DisputeMonthlyTrendPoint",
    "DisputeTypeBreakdown",
    "HighRiskCustomerRow",
    "HighRiskLaundryRow",
    "RevenuePeriod",
]
