"""Storefront builder API schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.laundry import LaundryDetailResponse, LaundryServiceResponse


class StorefrontGalleryItem(BaseModel):
    id: str
    url: str
    category: str = "store"
    sort_order: int = 0
    is_featured: bool = False
    caption: str | None = None


class StorefrontHighlight(BaseModel):
    title: str = Field(max_length=120)
    description: str | None = Field(default=None, max_length=500)


class StorefrontMachine(BaseModel):
    id: str
    name: str = Field(max_length=120)
    brand: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=2000)


class StorefrontTeamMember(BaseModel):
    id: str
    name: str = Field(max_length=120)
    role: str = Field(max_length=80)
    description: str | None = Field(default=None, max_length=500)
    photo_url: str | None = Field(default=None, max_length=2000)


class StorefrontCertification(BaseModel):
    id: str
    title: str = Field(max_length=120)
    issuer: str | None = Field(default=None, max_length=120)
    image_url: str | None = Field(default=None, max_length=2000)


class StorefrontVideo(BaseModel):
    id: str
    title: str = Field(max_length=120)
    url: str = Field(max_length=2000)
    video_type: str = Field(default="youtube", max_length=40)


class StorefrontTemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    brand_primary: str
    brand_secondary: str
    sample_facilities: list[str]
    sample_highlights: list[StorefrontHighlight]


class StorefrontResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    laundry_id: UUID
    template_id: str
    is_published: bool
    logo_url: str | None
    cover_url: str | None
    brand_primary: str | None
    brand_secondary: str | None
    tagline: str | None
    brand_story: str | None
    years_in_business: int | None
    owner_name: str | None
    contact_phone: str | None
    whatsapp_number: str | None = None
    show_call: bool = True
    show_whatsapp: bool = True
    show_callback: bool = True
    approval_status: str = "approved"
    working_hours: dict[str, str] | None
    pickup_radius_km: Decimal | None
    delivery_radius_km: Decimal | None
    facilities: list[str]
    highlights: list[StorefrontHighlight]
    gallery: list[StorefrontGalleryItem]
    machines: list[StorefrontMachine]
    team: list[StorefrontTeamMember]
    certifications: list[StorefrontCertification]
    videos: list[StorefrontVideo]
    completeness_score: int


class StorefrontUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_id: str | None = Field(default=None, max_length=40)
    is_published: bool | None = None
    logo_url: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = Field(default=None, max_length=2000)
    brand_primary: str | None = Field(default=None, max_length=7)
    brand_secondary: str | None = Field(default=None, max_length=7)
    tagline: str | None = Field(default=None, max_length=300)
    brand_story: str | None = None
    years_in_business: int | None = Field(default=None, ge=0, le=100)
    owner_name: str | None = Field(default=None, max_length=120)
    contact_phone: str | None = Field(default=None, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    show_call: bool | None = None
    show_whatsapp: bool | None = None
    show_callback: bool | None = None
    working_hours: dict[str, str] | None = None
    pickup_radius_km: Decimal | None = Field(default=None, ge=0, le=50)
    delivery_radius_km: Decimal | None = Field(default=None, ge=0, le=50)
    facilities: list[str] | None = None
    highlights: list[StorefrontHighlight] | None = None
    gallery: list[StorefrontGalleryItem] | None = None
    machines: list[StorefrontMachine] | None = None
    team: list[StorefrontTeamMember] | None = None
    certifications: list[StorefrontCertification] | None = None
    videos: list[StorefrontVideo] | None = None


class ApplyTemplateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_id: str = Field(max_length=40)


class PublicStorefrontResponse(BaseModel):
    storefront: StorefrontResponse
    laundry: LaundryDetailResponse
    orders_completed: int
    services: list[LaundryServiceResponse]
