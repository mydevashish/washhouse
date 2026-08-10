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
    payment_status: str
    customer_name: str
    customer_phone: str | None = None
    order_source: OrderSource = OrderSource.online
    items: list[OrderItemResponse] = Field(default_factory=list)
