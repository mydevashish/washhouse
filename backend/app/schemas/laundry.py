"""Laundry API schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LaundryServiceResponse(BaseModel):
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
    is_active: bool


class LaundryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    city: str
    avg_rating: Decimal
    review_count: int
    is_verified: bool


class LaundrySearchItem(LaundryListItem):
    """Search hit with optional relevance score."""

    rank_score: float | None = None


class LaundrySearchResult(BaseModel):
    items: list[LaundrySearchItem]
    total: int
    limit: int
    offset: int


class LaundryDetailResponse(LaundryListItem):
    description: str | None
    address_line: str
    services: list[LaundryServiceResponse] = Field(default_factory=list)


class PartnerLaundryRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    address_line: str = Field(min_length=5, max_length=500)
    description: str | None = None
