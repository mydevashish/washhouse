"""Partner garment catalog request/response schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import GarmentCategory, GarmentServiceType

ImportMode = Literal["upsert", "replace_categories_in_file", "replace_all"]

MAX_ITEM_PRICE_INR = Decimal("99999.99")


class GarmentServiceRateOut(BaseModel):
    price_inr: str | None = None
    price_paise: int | None = None


class GarmentCatalogItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    laundry_id: UUID
    category: GarmentCategory
    name: str
    garment_code: str
    image_url: str | None = None
    resolved_image_url: str | None = None
    platform_catalog_item_id: UUID | None = None
    is_visible: bool
    sort_order: int
    rates: dict[str, GarmentServiceRateOut] = Field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GarmentCatalogListResponse(BaseModel):
    items: list[GarmentCatalogItemOut]
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool
    has_previous: bool


class GarmentCatalogSummaryOut(BaseModel):
    total: int
    visible: int
    categories: int


class GarmentCatalogCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    garment_code: str = Field(min_length=1, max_length=20)
    category: GarmentCategory
    image_url: str | None = Field(default=None, max_length=2000)
    platform_catalog_item_id: UUID | None = None
    is_visible: bool = True
    sort_order: int = Field(default=0, ge=0)
    rates: dict[str, Decimal | None] | None = None

    @field_validator("rates", mode="before")
    @classmethod
    def _validate_rate_keys(cls, value: object) -> object:
        if value is None:
            return None
        if not isinstance(value, dict):
            return value
        for key in value:
            GarmentServiceType(key)
        return value


class GarmentCatalogUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    garment_code: str | None = Field(default=None, min_length=1, max_length=20)
    category: GarmentCategory | None = None
    image_url: str | None = Field(default=None, max_length=2000)
    platform_catalog_item_id: UUID | None = None
    is_visible: bool | None = None
    sort_order: int | None = Field(default=None, ge=0)
    rates: dict[str, Decimal | None] | None = None

    @field_validator("rates", mode="before")
    @classmethod
    def _validate_rate_keys(cls, value: object) -> object:
        if value is None:
            return None
        if not isinstance(value, dict):
            return value
        for key in value:
            GarmentServiceType(key)
        return value


class GarmentImportPreviewRow(BaseModel):
    row_number: int
    garment_code: str
    name: str
    category: GarmentCategory
    is_visible: bool
    rates: dict[str, float]


class GarmentImportErrorRow(BaseModel):
    row_number: int
    garment_code: str | None = None
    name: str | None = None
    errors: list[str]


class GarmentImportSummary(BaseModel):
    total_rows: int
    valid_count: int
    error_count: int
    create_count: int
    update_count: int


class GarmentImportPreviewResponse(BaseModel):
    preview_id: UUID
    summary: GarmentImportSummary
    valid_rows: list[GarmentImportPreviewRow]
    error_rows: list[GarmentImportErrorRow]


class GarmentImportConfirmRequest(BaseModel):
    preview_id: UUID
    mode: ImportMode = "upsert"
    skip_invalid: bool = True


class GarmentImportConfirmResponse(BaseModel):
    imported_count: int
    created_count: int
    updated_count: int
    skipped_error_count: int


class GarmentBulkDeleteRequest(BaseModel):
    ids: list[UUID] | None = None
    category: GarmentCategory | None = None
    delete_all: bool = Field(default=False, alias="all")
    confirm: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class GarmentBulkDeleteResponse(BaseModel):
    deleted_count: int


class GarmentImageUploadResponse(BaseModel):
    url: str
    garment: GarmentCatalogItemOut
