"""Partner panel schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ColorToken, OrderSource, OrderStatus, PartnerStaffRole
from app.schemas.order import OrderItemResponse
from app.utils.phone import validate_strict_indian_mobile


class InventoryUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_count: int = Field(ge=0, le=10_000)
    received_count: int = Field(ge=0, le=10_000)
    missing_notes: str | None = Field(default=None, max_length=2000)
    damaged_notes: str | None = Field(default=None, max_length=2000)


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: UUID
    expected_count: int
    received_count: int
    missing_notes: str | None
    damaged_notes: str | None


class StaffCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    role: PartnerStaffRole


class StaffUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    role: PartnerStaffRole | None = None


class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    phone: str | None
    role: PartnerStaffRole


class PartnerAnalyticsPeriodChartPoint(BaseModel):
    bucket_label: str
    revenue_gross_inr: str = Field(description="Delivered gross in bucket")
    partner_net_inr: str = Field(description="Gross minus snapshotted commission in bucket")


class PartnerAnalyticsPeriodScope(BaseModel):
    """Period-scoped money block for Revenue view (?period= query param)."""

    period: str = Field(description="today | week | month | year | custom")
    period_label_ist: str
    date_from: str | None = Field(default=None, description="YYYY-MM-DD when period=custom")
    date_to: str | None = Field(default=None, description="YYYY-MM-DD when period=custom")
    revenue_gross_inr: str
    commission_inr: str
    partner_net_inr: str
    revenue_walk_in_inr: str
    revenue_doorstep_inr: str
    growth_pct: str | None = Field(description="vs prior period; null when prior gross was zero")
    prior_period_label: str
    chart_series: list[PartnerAnalyticsPeriodChartPoint]


class PartnerAnalyticsResponse(BaseModel):
    """Partner dashboard KPIs + money intelligence (Owner Command Center P3).

    Money amounts are INR strings with 2 decimal places.
    `effective_commission_rate` is a **percent** (e.g. ``\"10.00\"`` = 10%),
    matching admin / order snapshot convention — not a 0–1 fraction.
    Growth fields are percent strings or null when the prior period is zero.
    """

    laundry_id: UUID | None = None
    laundry_name: str
    avg_rating: str
    review_count: int
    orders_total: int
    orders_today: int
    orders_pending: int
    orders_in_progress: int
    orders_ready: int
    pickup_requests: int
    orders_delivered: int
    customers_count: int
    revenue_inr: str = Field(description="All-time delivered gross INR")
    revenue_today_inr: str = Field(description="Delivered today gross (updated_at day window, UTC)")
    revenue_this_month_inr: str = Field(description="Delivered this month gross (created_at >= month start, UTC)")
    revenue_week_inr: str = Field(description="Delivered this week gross (updated_at >= week start Mon UTC)")
    revenue_yesterday_inr: str = Field(description="Delivered yesterday gross (updated_at, UTC)")
    revenue_prev_week_inr: str = Field(description="Previous calendar week delivered gross (updated_at)")
    revenue_prev_month_inr: str = Field(description="Previous calendar month delivered gross (created_at)")
    growth_today_pct: str | None = Field(
        default=None,
        description="Today vs yesterday gross %; null if yesterday was zero",
    )
    growth_week_pct: str | None = Field(
        default=None,
        description="This week vs previous week gross %; null if prior was zero",
    )
    growth_month_pct: str | None = Field(
        default=None,
        description="This month vs previous month gross %; null if prior was zero",
    )
    effective_commission_rate: str = Field(
        description="Resolved laundry platform commission percent (e.g. 10.00)",
    )
    commission_today_inr: str = Field(description="Sum of order snapshot commission ₹ today")
    commission_week_inr: str = Field(description="Sum of order snapshot commission ₹ this week")
    commission_month_inr: str = Field(description="Sum of order snapshot commission ₹ this month")
    partner_net_today_inr: str = Field(description="Gross today minus commission today")
    partner_net_week_inr: str = Field(description="Gross week minus commission week")
    partner_net_month_inr: str = Field(description="Gross month minus commission month")
    revenue_walk_in_today_inr: str = Field(default="0.00")
    revenue_doorstep_today_inr: str = Field(default="0.00")
    revenue_walk_in_week_inr: str = Field(default="0.00")
    revenue_doorstep_week_inr: str = Field(default="0.00")
    revenue_walk_in_month_inr: str = Field(default="0.00")
    revenue_doorstep_month_inr: str = Field(default="0.00")
    period_scope: PartnerAnalyticsPeriodScope | None = Field(
        default=None,
        description="Present when ?period= is passed — gross/net/walk-in split for that IST window",
    )


class PartnerAnalyticsOverviewChartPoint(BaseModel):
    bucket_label: str
    bucket_start_utc: str = Field(description="ISO-8601 UTC start of bucket")
    orders_count: int = Field(description="Orders created in bucket (IST)")
    pending_orders_count: int = Field(
        description="Non-terminal orders created in bucket (delivered/cancelled excluded)",
    )
    pending_payment_count: int = Field(description="Unpaid orders created in bucket")
    pending_payment_inr: str = Field(description="Outstanding ₹ for unpaid orders created in bucket")
    customers_count: int = Field(description="Distinct customers with orders created in bucket")
    revenue_gross_inr: str = Field(description="Delivered gross in bucket (updated_at IST)")
    revenue_net_inr: str = Field(description="Gross minus snapshotted commission in bucket")


class PartnerAnalyticsOverviewResponse(BaseModel):
    """Period-scoped partner dashboard KPIs + chart series (IST calendar windows)."""

    period: str = Field(description="today | week | month")
    period_label_ist: str
    period_start_utc: str
    period_end_utc: str
    orders_count: int
    pending_orders_count: int = Field(
        description="Non-terminal orders created in period (delivered/cancelled excluded)",
    )
    revenue_gross_inr: str = Field(description="Delivered gross in period (updated_at IST window)")
    revenue_net_inr: str
    commission_inr: str
    effective_commission_rate: str = Field(
        description="Resolved laundry platform commission percent (e.g. 10.00)",
    )
    pending_payment_count: int
    pending_payment_inr: str
    customers_count_period: int
    customers_count_all_time: int
    chart_series: list[PartnerAnalyticsOverviewChartPoint]


class PartnerDashboardKpis(BaseModel):
    """Always today / week / month IST — independent of the chart period chip."""

    orders_today: int
    orders_yesterday: int
    orders_week: int
    orders_prev_week: int
    orders_month: int
    orders_prev_month: int
    revenue_today_inr: str
    revenue_yesterday_inr: str
    revenue_week_inr: str
    revenue_prev_week_inr: str
    revenue_month_inr: str
    revenue_prev_month_inr: str


class PartnerDashboardStatusSnapshot(BaseModel):
    """Global open-queue counts (not period-scoped)."""

    in_process: int = Field(description="picked_up + washing + ironing")
    ready_for_delivery: int = Field(description="ready + out_for_delivery")
    completed: int = Field(description="delivered all-time")


class PartnerDashboardChartPoint(BaseModel):
    bucket_label: str
    current_revenue_inr: str = Field(description="Delivered gross in this bucket (updated_at IST)")
    previous_revenue_inr: str = Field(description="Aligned previous-period bucket delivered gross")


class PartnerDashboardStatusDonut(BaseModel):
    """Period-scoped current-status counts (cancelled excluded)."""

    in_process: int
    ready: int
    completed: int


class PartnerDashboardTopService(BaseModel):
    name: str
    order_lines: int = Field(description="Sum of order_items.quantity in the chart period")
    share_pct: str = Field(description="Percent of all line quantities in the period, 1 decimal")


class PartnerDashboardPaymentSummary(BaseModel):
    cash_paid_inr: str = Field(description="COD + paid, chart period, created_at")
    upi_paid_inr: str = Field(description="Razorpay + paid, chart period, created_at")
    wallet_tracked: bool = Field(description="Always false — no wallet payment_method")
    pending_inr: str = Field(description="pending + pending_cod, chart period, created_at")


class PartnerDashboardBottomStats(BaseModel):
    customers_total: int
    customers_new_week: int
    customers_repeat: int
    avg_order_value_inr: str
    avg_delivery_minutes: float | None = Field(
        default=None,
        description="Mean pickup_at → delivered_at/updated_at minutes; null if none",
    )
    avg_rating: str
    review_count: int


class PartnerAnalyticsDashboardResponse(BaseModel):
    """Live `/partner` franchise dashboard payload (IST windows)."""

    laundry_id: UUID | None = None
    laundry_name: str
    kpis: PartnerDashboardKpis
    status_snapshot: PartnerDashboardStatusSnapshot
    period: str = Field(description="today | week | month | year")
    period_label_ist: str
    chart_series: list[PartnerDashboardChartPoint]
    status_donut: PartnerDashboardStatusDonut
    top_services: list[PartnerDashboardTopService]
    payment_summary: PartnerDashboardPaymentSummary
    bottom: PartnerDashboardBottomStats


class PartnerCustomerSummary(BaseModel):
    user_id: UUID
    name: str
    order_count: int
    total_spent_inr: str
    last_order_at: str | None


class PartnerCustomerCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(max_length=20)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_strict_indian_mobile(value)


class PartnerCustomerUpdateRequest(BaseModel):
    """Partner-scoped customer profile edit — phone is immutable (not in body)."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    gender: str | None = Field(default=None, max_length=10)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip().lower()
        if normalized not in ("male", "female"):
            raise ValueError("gender must be male or female")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed.lower() if trimmed else None


class PartnerCustomerUpdateResponse(BaseModel):
    user_id: UUID
    name: str
    phone: str | None
    email: str | None = None
    gender: str | None = None
    notes: str | None = None
    registered: bool = True


class PartnerOrderResponse(BaseModel):
    """Order row for partner dashboard (includes customer name)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    laundry_id: UUID
    status: OrderStatus
    tracking_code: str
    color_token: ColorToken | None = None
    token_code: str | None = None
    token_day_number: int | None = None
    pickup_at: datetime
    delivery_at: datetime
    created_at: datetime
    address_line1: str | None = None
    address_line2: str | None = None
    address_city: str | None = None
    address_pincode: str | None = None
    subtotal_inr: Decimal
    delivery_fee_inr: Decimal
    cgst_inr: Decimal
    sgst_inr: Decimal
    total_inr: Decimal
    paid_inr: str = Field(description="Captured payments + COD advance (decimal string)")
    pending_inr: str = Field(description="max(0, total_inr - paid_inr) (decimal string)")
    payment_status: str
    customer_name: str
    customer_phone: str | None = None
    order_source: OrderSource = OrderSource.online
    items: list[OrderItemResponse] = Field(default_factory=list)
