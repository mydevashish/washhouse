"""Admin API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import OrderStatus, UserRole


class CommissionDefaultRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rate: Decimal = Field(ge=0, le=100)


class CommissionLaundryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rate: Decimal | None = Field(default=None, ge=0, le=100)


class AdminServiceLineRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    category: str = Field(default="wash", max_length=80)
    unit: str = Field(default="kg", max_length=40)
    price_inr: Decimal = Field(gt=0)


def _default_laundry_services() -> list[AdminServiceLineRequest]:
    return [
        AdminServiceLineRequest(
            name="Wash & Fold",
            category="wash",
            unit="kg",
            price_inr=Decimal("80"),
        ),
    ]


class AdminCreateLaundryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    owner_email: EmailStr
    owner_full_name: str = Field(min_length=1, max_length=200)
    owner_password: str | None = Field(default=None, min_length=8, max_length=128)
    name: str = Field(min_length=2, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    address_line: str = Field(min_length=5, max_length=500)
    description: str | None = None
    auto_approve: bool = True
    services: list[AdminServiceLineRequest] = Field(default_factory=_default_laundry_services)


class AdminCreateLaundryResponse(BaseModel):
    laundry_id: str
    owner_user_id: str
    owner_email: str
    status: str
    services_count: int


class AdminDashboardResponse(BaseModel):
    orders_total: int
    users_total: int
    customers_total: int
    laundries_approved: int
    laundries_pending: int
    revenue_total_inr: str
    revenue_month_inr: str
    commission_month_inr: str
    orders_today: int
    orders_in_progress: int
    complaints_open: int


class AdminAnalyticsPoint(BaseModel):
    date: str
    orders: int
    revenue_inr: str
    new_customers: int
    new_laundries: int


class AdminAnalyticsResponse(BaseModel):
    orders_trend: list[AdminAnalyticsPoint]
    top_cities: list[dict]
    top_laundries: list[dict]


class AdminLaundryManagementRow(BaseModel):
    id: UUID
    name: str
    owner_name: str
    owner_email: str | None
    city: str
    status: str
    global_commission_rate: str
    custom_commission_rate: str | None
    effective_commission_rate: str
    orders_count: int
    revenue_inr: str
    rating: str
    review_count: int
    created_at: datetime


class AdminAuditLogRow(BaseModel):
    id: str
    timestamp: datetime
    user_name: str
    user_email: str | None
    role: str | None
    entity: str
    action: str
    old_value: str | None
    new_value: str | None
    ip_address: str | None
    source: str
    resource_id: str | None


class AdminPendingLaundryResponse(BaseModel):
    id: UUID
    name: str
    city: str
    address_line: str
    owner_email: str | None
    created_at: datetime


class AdminOrderRowResponse(BaseModel):
    id: UUID
    tracking_code: str
    status: OrderStatus
    total_inr: Decimal
    payment_status: str
    created_at: datetime
    laundry_name: str
    customer_name: str


class AdminUserRowResponse(BaseModel):
    id: UUID
    email: str | None
    full_name: str
    role: UserRole
    created_at: datetime
    is_email_verified: bool
