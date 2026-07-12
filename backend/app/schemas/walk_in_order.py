"""Walk-in order schemas for partner offline entry."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus
from app.schemas.order import OrderItemResponse


class WalkInOrderLineItemRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service_id: UUID
    quantity: int = Field(ge=1, le=500)


class WalkInOrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_name: str = Field(min_length=1, max_length=200)
    customer_phone: str = Field(pattern=r"^\+?[1-9]\d{9,14}$")
    items: list[WalkInOrderLineItemRequest] = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)
    expected_ready_at: datetime | None = None


class WalkInOrderResponse(BaseModel):
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
    customer_phone: str
    partner_notes: str | None
    user_id: UUID | None
    expected_ready_at: datetime | None = None
    items: list[OrderItemResponse] = Field(default_factory=list)
