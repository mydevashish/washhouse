"""Public laundry garment price-list response schemas.

Only this laundry's offered prices — no platform suggested rates or partner editor fields.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CatalogCategory, CatalogUnit


class PublicLaundryPriceListItemOut(BaseModel):
    """One offered catalog item with this laundry's published prices."""

    model_config = ConfigDict(from_attributes=True)

    catalog_item_id: UUID
    slug: str
    name: str
    category: CatalogCategory
    unit: CatalogUnit
    sort_order: int
    currency: str = "INR"
    price_mode: str  # "single" | "dual" | "deferred"

    dry_clean_inr: str | None = None
    press_inr: str | None = None
    price_inr: str | None = None
    dry_clean_paise: int | None = None
    press_paise: int | None = None
    price_paise: int | None = None


class PublicLaundryPriceListResponse(BaseModel):
    laundry_id: UUID
    items: list[PublicLaundryPriceListItemOut] = Field(default_factory=list)
    item_count: int = 0
    has_published_list: bool = False
