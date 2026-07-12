"""Order API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus
from app.schemas.custody_event import CustodyTimelineResponse
from app.schemas.delivery_otp import DeliveryVerificationStatusResponse
from app.schemas.delivery_proof import DeliveryProofPhotoResponse
from app.schemas.inventory_verification import InventoryVerificationResponse
from app.schemas.pickup_evidence import PickupEvidencePhotoResponse
from app.services.inventory_verification_service import InventoryVerificationService


class OrderLineItemRequest(BaseModel):
    service_id: UUID
    quantity: int = Field(ge=1, le=500)


class OrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    laundry_id: UUID
    address_id: UUID
    pickup_at: datetime
    delivery_at: datetime
    items: list[OrderLineItemRequest]
    notes: str | None = Field(default=None, max_length=2000)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    service_name: str
    quantity: int
    line_total_inr: Decimal


class OrderListItemResponse(BaseModel):
    """Lightweight order row for list endpoints (no line items)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    laundry_id: UUID
    status: OrderStatus
    tracking_code: str
    pickup_at: datetime
    delivery_at: datetime
    total_inr: Decimal
    payment_status: str


class OrderStatusEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: OrderStatus
    note: str | None
    created_at: datetime


class OrderResponse(BaseModel):
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
    items: list[OrderItemResponse] = Field(default_factory=list)


class OrderDetailResponse(OrderResponse):
    """Order + timeline events (single round-trip for tracking UI)."""

    events: list[OrderStatusEventResponse] = Field(default_factory=list)
    pickup_evidence: list[PickupEvidencePhotoResponse] = Field(default_factory=list)
    inventory_verification: InventoryVerificationResponse | None = None
    delivery_verification: DeliveryVerificationStatusResponse | None = None
    delivery_proof: DeliveryProofPhotoResponse | None = None
    custody_timeline: CustodyTimelineResponse | None = None


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus
