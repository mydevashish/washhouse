"""Walk-in order schemas for partner offline entry."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ColorToken, OrderStatus
from app.schemas.order import OrderItemResponse


class WalkInCatalogProcess(str, Enum):
    """Process when lining a dual-priced catalog garment."""

    dry_clean = "dry_clean"
    press = "press"
    single = "single"


class WalkInOrderLineItemRequest(BaseModel):
    """Exactly one of ``service_id`` (legacy list) or ``catalog_item_id`` (Cloth Wall)."""

    model_config = ConfigDict(extra="forbid")

    service_id: UUID | None = None
    catalog_item_id: UUID | None = None
    process: WalkInCatalogProcess | None = None
    quantity: int = Field(ge=1, le=500)

    @model_validator(mode="after")
    def require_exactly_one_source(self) -> WalkInOrderLineItemRequest:
        has_service = self.service_id is not None
        has_catalog = self.catalog_item_id is not None
        if has_service == has_catalog:
            raise ValueError("Provide exactly one of service_id or catalog_item_id")
        if has_service and self.process is not None:
            raise ValueError("process is only valid with catalog_item_id")
        return self


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
    color_token: ColorToken | None = None
    token_code: str | None = None
    token_day_number: int | None = None
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
