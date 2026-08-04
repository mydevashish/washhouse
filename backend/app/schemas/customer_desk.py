"""Customer Desk lookup + order history + assisted create schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OrderSource, OrderStatus, PaymentMethod


class CustomerDeskProfile(BaseModel):
    """Lightweight desk profile stub returned by lookup."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID | None = None
    name: str | None = None
    phone: str
    email: str | None = None
    registered: bool = False
    order_count: int = 0
    last_order_at: datetime | None = None


class CustomerDeskOrderRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tracking_code: str
    status: OrderStatus
    order_source: OrderSource
    laundry_id: UUID
    laundry_name: str
    customer_name: str | None = None
    customer_phone: str | None = None
    subtotal_inr: Decimal
    delivery_fee_inr: Decimal
    cgst_inr: Decimal
    sgst_inr: Decimal
    total_inr: Decimal
    currency: str = "INR"
    pickup_at: datetime
    delivery_at: datetime
    created_at: datetime
    created_by_user_id: UUID | None = None
    item_summary: str | None = None


class CustomerDeskOrdersPage(BaseModel):
    items: list[CustomerDeskOrderRow]
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool
    has_previous: bool


class AssistedOrderAddress(BaseModel):
    model_config = ConfigDict(extra="forbid")

    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=6, max_length=10, pattern=r"^\d{6}$")
    landmark: str | None = Field(default=None, max_length=200)


class AssistedOrderLineItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service_id: UUID
    quantity: int = Field(ge=1, le=500)


class AssistedOrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: str = Field(min_length=10, max_length=20)
    customer_name: str = Field(min_length=1, max_length=200)
    laundry_id: UUID
    address_id: UUID | None = None
    address: AssistedOrderAddress | None = None
    pickup_at: datetime
    delivery_at: datetime
    items: list[AssistedOrderLineItem] = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)
    payment_method: PaymentMethod = PaymentMethod.cod
    reorder_from_order_id: UUID | None = None
    save_address_to_user: bool = False

    @model_validator(mode="after")
    def require_address_xor_snapshot(self) -> AssistedOrderCreateRequest:
        has_id = self.address_id is not None
        has_snap = self.address is not None
        if has_id == has_snap:
            raise ValueError("Provide exactly one of address_id or address snapshot")
        return self


class AssistedOrderQuoteResponse(BaseModel):
    subtotal_inr: Decimal
    delivery_fee_inr: Decimal
    gst_rate: Decimal
    cgst_inr: Decimal
    sgst_inr: Decimal
    total_inr: Decimal
    currency: str = "INR"
    warnings: list[str] = Field(default_factory=list)


class AssistedOrderCreateResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tracking_code: str
    status: OrderStatus
    total_inr: Decimal
    currency: str = "INR"
    order_source: OrderSource
    user_id: UUID | None = None
    created_by_user_id: UUID | None = None
