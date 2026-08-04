"""Booking request request/response schemas."""

from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import (
    BookingRequestCreatedByRole,
    BookingRequestEventType,
    BookingRequestMessageAuthorRole,
    BookingRequestMessageVisibility,
    BookingRequestPreferredTime,
    BookingRequestPriority,
    BookingRequestServiceType,
    BookingRequestSource,
    BookingRequestStatus,
    OrderSource,
    PaymentMethod,
)
from app.schemas.customer_desk import AssistedOrderAddress, AssistedOrderLineItem
from app.utils.phone import validate_strict_indian_mobile

_PINCODE_RE = re.compile(r"^\d{6}$")
_PUBLIC_SOURCES = {
    BookingRequestSource.marketing_home,
    BookingRequestSource.stores,
    BookingRequestSource.services,
    BookingRequestSource.deep_link,
}


class BookingRequestPublicCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    service_type: BookingRequestServiceType
    preferred_time_window: BookingRequestPreferredTime
    notes: str | None = Field(default=None, max_length=1500)
    address_text: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    source: BookingRequestSource = BookingRequestSource.marketing_home

    @field_validator("customer_name", "notes", "address_text", "city", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("customer_name", mode="after")
    @classmethod
    def require_name(cls, value: str | None) -> str:
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_strict_indian_mobile(value)

    @field_validator("pincode", mode="before")
    @classmethod
    def validate_pincode(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        cleaned = str(value).strip()
        if not _PINCODE_RE.fullmatch(cleaned):
            raise ValueError("Enter a valid 6-digit Indian pincode")
        return cleaned

    @field_validator("source")
    @classmethod
    def public_source_only(cls, value: BookingRequestSource) -> BookingRequestSource:
        if value not in _PUBLIC_SOURCES:
            raise ValueError("Invalid source for public booking request")
        return value


class BookingRequestAdminCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    service_type: BookingRequestServiceType
    preferred_time_window: BookingRequestPreferredTime
    notes: str | None = Field(default=None, max_length=1500)
    address_text: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    assigned_laundry_id: UUID | None = None
    priority: BookingRequestPriority = BookingRequestPriority.normal
    status: BookingRequestStatus | None = None

    @field_validator("customer_name", "notes", "address_text", "city", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("customer_name", mode="after")
    @classmethod
    def require_name(cls, value: str | None) -> str:
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_strict_indian_mobile(value)

    @field_validator("pincode", mode="before")
    @classmethod
    def validate_pincode(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        cleaned = str(value).strip()
        if not _PINCODE_RE.fullmatch(cleaned):
            raise ValueError("Enter a valid 6-digit Indian pincode")
        return cleaned


class BookingRequestPartnerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    service_type: BookingRequestServiceType
    preferred_time_window: BookingRequestPreferredTime
    notes: str | None = Field(default=None, max_length=1500)
    address_text: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    priority: BookingRequestPriority = BookingRequestPriority.normal

    @field_validator("customer_name", "notes", "address_text", "city", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("customer_name", mode="after")
    @classmethod
    def require_name(cls, value: str | None) -> str:
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_strict_indian_mobile(value)

    @field_validator("pincode", mode="before")
    @classmethod
    def validate_pincode(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        cleaned = str(value).strip()
        if not _PINCODE_RE.fullmatch(cleaned):
            raise ValueError("Enter a valid 6-digit Indian pincode")
        return cleaned


class BookingRequestUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_name: str | None = Field(default=None, min_length=1, max_length=100)
    service_type: BookingRequestServiceType | None = None
    preferred_time_window: BookingRequestPreferredTime | None = None
    notes: str | None = Field(default=None, max_length=1500)
    address_text: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    priority: BookingRequestPriority | None = None
    status: BookingRequestStatus | None = None

    @field_validator("customer_name", "notes", "address_text", "city", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("pincode", mode="before")
    @classmethod
    def validate_pincode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value == "":
            return None
        cleaned = str(value).strip()
        if not _PINCODE_RE.fullmatch(cleaned):
            raise ValueError("Enter a valid 6-digit Indian pincode")
        return cleaned


class BookingRequestAssign(BaseModel):
    model_config = ConfigDict(extra="forbid")

    laundry_id: UUID
    note: str | None = Field(default=None, max_length=1000)

    @field_validator("note", mode="before")
    @classmethod
    def strip_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class BookingRequestMessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=4000)
    visibility: BookingRequestMessageVisibility = BookingRequestMessageVisibility.customer_facing

    @field_validator("body", mode="before")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()


class BookingRequestConvert(BaseModel):
    """Convert confirmed (or force) booking request → assisted doorstep order.

    Phone/name always come from the booking request. Address may be supplied
    explicitly or derived from BR ``address_text`` / city / pincode.
    """

    model_config = ConfigDict(extra="forbid")

    force: bool = False
    laundry_id: UUID | None = None
    address_id: UUID | None = None
    address: AssistedOrderAddress | None = None
    pickup_at: datetime
    delivery_at: datetime
    items: list[AssistedOrderLineItem] = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)
    payment_method: PaymentMethod = PaymentMethod.cod

    @model_validator(mode="after")
    def address_xor_and_slots(self) -> BookingRequestConvert:
        if self.address_id is not None and self.address is not None:
            raise ValueError("Provide at most one of address_id or address snapshot")
        if self.delivery_at <= self.pickup_at:
            raise ValueError("Delivery time must be after pickup time")
        return self


class BookingRequestConvertResult(BaseModel):
    booking_request_id: UUID
    public_code: str
    status: BookingRequestStatus
    converted_order_id: UUID
    tracking_code: str
    order_source: OrderSource
    total_inr: Decimal
    currency: str = "INR"


class BookingRequestPublicCreated(BaseModel):
    id: UUID
    public_code: str
    status: BookingRequestStatus


class BookingRequestMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_request_id: UUID
    author_user_id: UUID | None
    author_role: BookingRequestMessageAuthorRole
    visibility: BookingRequestMessageVisibility
    body: str
    created_at: datetime


class BookingRequestEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_request_id: UUID
    event_type: BookingRequestEventType
    actor_user_id: UUID | None
    from_status: BookingRequestStatus | None
    to_status: BookingRequestStatus | None
    from_laundry_id: UUID | None
    to_laundry_id: UUID | None
    payload: dict | None
    created_at: datetime


class BookingRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    public_code: str
    customer_name: str
    phone_e164: str
    service_type: BookingRequestServiceType
    preferred_time_window: BookingRequestPreferredTime
    address_text: str | None = None
    city: str | None = None
    pincode: str | None = None
    notes: str | None = None
    source: BookingRequestSource
    status: BookingRequestStatus
    priority: BookingRequestPriority
    sla_badge: str
    sla_age_seconds: int
    assigned_laundry_id: UUID | None = None
    assigned_laundry_name: str | None = None
    assigned_at: datetime | None = None
    assigned_by_user_id: UUID | None = None
    converted_order_id: UUID | None = None
    created_by_role: BookingRequestCreatedByRole
    created_by_user_id: UUID | None = None
    last_response_at: datetime | None = None
    closed_at: datetime | None = None
    deleted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    whatsapp_url: str
    open_duplicate_ids: list[UUID] = Field(default_factory=list)


class BookingRequestDetailOut(BookingRequestOut):
    messages: list[BookingRequestMessageOut] = Field(default_factory=list)
    events: list[BookingRequestEventOut] = Field(default_factory=list)


class BookingRequestPhoneTimelineOut(BaseModel):
    phone_e164: str
    requests: list[BookingRequestOut]
    messages_preview: list[BookingRequestMessageOut] = Field(default_factory=list)


class BookingRequestLaundrySuggestion(BaseModel):
    """Ranked laundry hint for admin assign UI (v1.1 suggest-nearest)."""

    laundry_id: UUID
    name: str
    city: str
    avg_rating: float
    reason: str
    score: float


class BookingRequestSuggestLaundriesOut(BaseModel):
    suggestions: list[BookingRequestLaundrySuggestion] = Field(default_factory=list)
