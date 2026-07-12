"""Partner panel schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderSource, OrderStatus, PartnerStaffRole
from app.schemas.order import OrderItemResponse


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


class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    phone: str | None
    role: PartnerStaffRole


class PartnerAnalyticsResponse(BaseModel):
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
    revenue_inr: str
    revenue_today_inr: str
    revenue_this_month_inr: str
    revenue_week_inr: str


class PartnerCustomerSummary(BaseModel):
    user_id: UUID
    name: str
    order_count: int
    total_spent_inr: str
    last_order_at: str | None


class PartnerOrderResponse(BaseModel):
    """Order row for partner dashboard (includes customer name)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    laundry_id: UUID
    status: OrderStatus
    tracking_code: str
    pickup_at: datetime
    delivery_at: datetime
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
