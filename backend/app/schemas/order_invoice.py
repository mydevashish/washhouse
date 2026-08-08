"""Partner order invoice / counter-bill print schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ColorToken


class InvoicePrintVariant(str, Enum):
    bill = "bill"
    gst = "gst"


class OrderInvoiceLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service_name: str
    quantity: int
    unit_price_inr: Decimal
    line_total_inr: Decimal


class OrderInvoiceResponse(BaseModel):
    """Idempotent invoice snapshot — amounts mirror persisted order fields only."""

    model_config = ConfigDict(extra="forbid")

    order_id: UUID
    laundry_id: UUID
    laundry_name: str
    laundry_address: str | None = None
    laundry_city: str | None = None
    laundry_gstin: str | None = None
    invoice_number: str
    color_token: ColorToken | None = None
    token_code: str | None = None
    token_day_number: int | None = None
    token_assigned_on: date | None = None
    customer_name: str
    customer_phone: str
    customer_phone_last4: str
    tracking_code: str
    created_at: datetime
    currency: str = "INR"
    subtotal_inr: Decimal
    delivery_fee_inr: Decimal
    gst_rate: Decimal
    cgst_inr: Decimal
    sgst_inr: Decimal
    total_inr: Decimal
    payment_status: str
    lines: list[OrderInvoiceLine] = Field(default_factory=list)
