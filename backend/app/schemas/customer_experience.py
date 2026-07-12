"""Customer experience API schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ServiceCategoryRow(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None
    icon: str | None
    sort_order: int
    is_active: bool


class FacilityTagRow(BaseModel):
    id: UUID
    slug: str
    name: str
    sort_order: int
    is_active: bool


class ServiceCatalogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str
    unit: str
    price_inr: Decimal
    description: str | None = None
    estimated_duration_minutes: int | None = None
    express_available: bool = False
    pickup_available: bool = True
    delivery_available: bool = True
    catalog_status: str = "active"
    view_count: int = 0
    order_count: int = 0
    sort_order: int = 0
    is_active: bool = True


class ServiceCatalogCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=80)
    unit: str = Field(default="piece", max_length=40)
    price_inr: Decimal = Field(gt=Decimal("0"))
    description: str | None = None
    estimated_duration_minutes: int | None = Field(default=None, ge=5, le=10080)
    express_available: bool = False
    pickup_available: bool = True
    delivery_available: bool = True
    catalog_status: str = Field(default="active", pattern="^(active|paused|draft)$")
    sort_order: int = Field(default=0, ge=0)


class ServiceCatalogUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    unit: str | None = Field(default=None, max_length=40)
    price_inr: Decimal | None = Field(default=None, gt=Decimal("0"))
    description: str | None = None
    estimated_duration_minutes: int | None = Field(default=None, ge=5, le=10080)
    express_available: bool | None = None
    pickup_available: bool | None = None
    delivery_available: bool | None = None
    catalog_status: str | None = Field(default=None, pattern="^(active|paused|draft)$")
    sort_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ContactInfoResponse(BaseModel):
    offline_booking_mode: bool = False
    can_contact: bool
    requires_login: bool
    show_call: bool
    show_whatsapp: bool
    show_callback: bool
    phone: str | None = None
    whatsapp_number: str | None = None
    whatsapp_url: str | None = None
    address_line: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    full_address: str | None = None
    map_url: str | None = None
    working_hours: dict[str, str] | None = None


class TrackEngagementRequest(BaseModel):
    event_type: str
    service_id: UUID | None = None
    source: str | None = Field(default=None, max_length=40)


class CallbackRequestCreate(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    preferred_time: str | None = Field(default=None, max_length=120)


class QuestionCreate(BaseModel):
    question: str = Field(min_length=5, max_length=1000)


class QuestionAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)


class QuestionRow(BaseModel):
    id: UUID
    laundry_id: UUID
    customer_id: UUID
    question: str
    answer: str | None
    status: str
    answered_at: str | None
    created_at: str


class EngagementAnalytics(BaseModel):
    store_views: int
    service_views: int
    calls_generated: int
    whatsapp_clicks: int
    questions_asked: int
    callback_requests: int
    conversion_rate_pct: float


class AdminEngagementOverview(BaseModel):
    store_views: int
    service_views: int
    calls_generated: int
    whatsapp_clicks: int
    questions_asked: int
    callback_requests: int
    pending_questions: int
    pending_storefronts: int
