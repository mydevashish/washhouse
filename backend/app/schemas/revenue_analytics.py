"""Admin laundry-wise revenue analytics schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RevenuePeriod(str, Enum):
    today = "today"
    yesterday = "yesterday"
    last_7_days = "last_7_days"
    last_30_days = "last_30_days"
    this_month = "this_month"
    last_month = "last_month"
    custom = "custom"


class RevenueOverviewResponse(BaseModel):
    total_platform_revenue_inr: str
    platform_commission_inr: str
    total_orders: int
    delivered_orders: int
    average_order_value_inr: str
    active_laundries: int
    top_laundry_name: str | None
    top_laundry_revenue_inr: str | None
    period_label: str
    date_from: datetime
    date_to: datetime


class RevenueInsight(BaseModel):
    text: str
    severity: str = "info"


class TopLaundryLeaderboardRow(BaseModel):
    rank: int
    laundry_id: UUID
    laundry_name: str
    partner_name: str
    city: str
    revenue_inr: str
    orders_count: int
    growth_pct: str
    commission_inr: str


class LaundryRevenueRow(BaseModel):
    laundry_id: UUID
    laundry_name: str
    partner_id: UUID
    partner_name: str
    city: str
    state: str
    orders_count: int
    revenue_inr: str
    commission_inr: str
    net_payout_inr: str
    refund_amount_inr: str
    disputes_count: int
    average_rating: str
    status: str
    growth_pct: str


class PaginatedLaundryRevenueResponse(BaseModel):
    items: list[LaundryRevenueRow]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChartDataPoint(BaseModel):
    label: str
    value: str
    orders: int = 0


class MonthlyTrendPoint(BaseModel):
    month: str
    revenue_inr: str
    orders: int
    commission_inr: str


class RevenueChartsResponse(BaseModel):
    revenue_by_laundry: list[ChartDataPoint]
    orders_by_laundry: list[ChartDataPoint]
    commission_by_laundry: list[ChartDataPoint]
    revenue_growth: list[ChartDataPoint]
    monthly_trend: list[MonthlyTrendPoint]


class CommissionAnalyticsBlock(BaseModel):
    total_laundry_revenue_inr: str
    average_commission_pct: str
    total_commission_earned_inr: str
    total_net_partner_earnings_inr: str
    pending_settlements_inr: str
    completed_settlements_inr: str


class RefundReasonRow(BaseModel):
    reason: str
    count: int
    amount_inr: str


class RefundAnalyticsBlock(BaseModel):
    refund_amount_inr: str
    refund_count: int
    refund_pct: str
    by_reason: list[RefundReasonRow]
    by_laundry: list[ChartDataPoint]


class DisputeAnalyticsBlock(BaseModel):
    open_disputes: int
    resolved_disputes: int
    dispute_rate_pct: str
    common_issues: list[ChartDataPoint]


class BranchRevenueRow(BaseModel):
    laundry_id: UUID
    laundry_name: str
    city: str
    revenue_inr: str
    orders_count: int
    commission_inr: str
    net_payout_inr: str
    growth_pct: str


class PartnerBranchSummary(BaseModel):
    partner_id: UUID
    partner_name: str
    branch_count: int
    total_revenue_inr: str
    total_orders: int
    total_commission_inr: str
    branches: list[BranchRevenueRow]


class LaundryRevenueDetailResponse(BaseModel):
    laundry_id: UUID
    laundry_name: str
    partner_id: UUID
    partner_name: str
    city: str
    state: str
    status: str
    average_rating: str
    commission_rate: str
    overview: RevenueOverviewResponse
    commission: CommissionAnalyticsBlock
    refunds: RefundAnalyticsBlock
    disputes: DisputeAnalyticsBlock
    monthly_trend: list[MonthlyTrendPoint]
    partner_branches: PartnerBranchSummary | None = None


class RevenueAnalyticsDashboardResponse(BaseModel):
    overview: RevenueOverviewResponse
    insights: list[RevenueInsight]
    top_laundries: list[TopLaundryLeaderboardRow]
    commission: CommissionAnalyticsBlock
    refunds: RefundAnalyticsBlock
    disputes: DisputeAnalyticsBlock
