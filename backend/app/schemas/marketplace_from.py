"""Public marketplace “from ₹” aggregate response schemas."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CatalogCategory, CatalogUnit

MarketplaceFromSource = Literal["aggregate", "suggested"]


class MarketplaceFromItemOut(BaseModel):
    """One catalog item with marketplace min “from” prices (or suggested fallback)."""

    model_config = ConfigDict(from_attributes=True)

    catalog_item_id: UUID
    slug: str
    name: str
    category: CatalogCategory
    unit: CatalogUnit
    sort_order: int
    currency: str = "INR"
    price_mode: str  # "single" | "dual" | "deferred"
    source: MarketplaceFromSource

    from_dry_clean_inr: str | None = None
    from_press_inr: str | None = None
    from_price_inr: str | None = None
    from_dry_clean_paise: int | None = None
    from_press_paise: int | None = None
    from_price_paise: int | None = None


class MarketplaceFromResponse(BaseModel):
    items: list[MarketplaceFromItemOut] = Field(default_factory=list)
    item_count: int = 0
