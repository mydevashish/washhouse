"""Partner garment price-list request/response schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import CatalogCategory, CatalogUnit

# Sane per-item cap (NUMERIC(12,2) allows far more; garments stay well below this).
MAX_ITEM_PRICE_INR = Decimal("99999.99")


class PartnerPriceListItemOut(BaseModel):
    """Catalog row joined with this laundry's override (if any)."""

    model_config = ConfigDict(from_attributes=True)

    catalog_item_id: UUID
    slug: str
    name: str
    category: CatalogCategory
    unit: CatalogUnit
    sort_order: int
    currency: str = "INR"

    suggested_dry_clean_inr: str | None = None
    suggested_press_inr: str | None = None
    suggested_price_inr: str | None = None
    suggested_dry_clean_paise: int | None = None
    suggested_press_paise: int | None = None
    suggested_price_paise: int | None = None

    dry_clean_inr: str | None = None
    press_inr: str | None = None
    price_inr: str | None = None
    dry_clean_paise: int | None = None
    press_paise: int | None = None
    price_paise: int | None = None

    is_offered: bool | None = None
    has_override: bool = False
    allows_press: bool = False
    price_mode: str  # "single" | "dual" | "deferred"


class PartnerPriceListResponse(BaseModel):
    items: list[PartnerPriceListItemOut]
    offered_count: int
    total_catalog_items: int


class _PriceFieldsMixin(BaseModel):
    dry_clean_inr: Decimal | None = Field(default=None, ge=Decimal("0"), le=MAX_ITEM_PRICE_INR)
    press_inr: Decimal | None = Field(default=None, ge=Decimal("0"), le=MAX_ITEM_PRICE_INR)
    price_inr: Decimal | None = Field(default=None, ge=Decimal("0"), le=MAX_ITEM_PRICE_INR)
    sort_order: int | None = Field(default=None, ge=0, le=1_000_000)

    @field_validator("dry_clean_inr", "press_inr", "price_inr", mode="before")
    @classmethod
    def _quantize_money(cls, value: object) -> object:
        if value is None or value == "":
            return None
        if isinstance(value, (int, float, str, Decimal)):
            return Decimal(str(value)).quantize(Decimal("0.01"))
        return value

    @model_validator(mode="after")
    def _price_shape(self) -> _PriceFieldsMixin:
        has_single = self.price_inr is not None
        has_dual = self.dry_clean_inr is not None or self.press_inr is not None
        if has_single and has_dual:
            raise ValueError("Use either price_inr or dry_clean_inr/press_inr, not both")
        return self


class PartnerPriceItemUpsert(_PriceFieldsMixin):
    """Single item upsert payload for bulk PUT."""

    model_config = ConfigDict(extra="forbid")

    catalog_item_id: UUID
    is_offered: bool = True


class PartnerPriceItemPatch(_PriceFieldsMixin):
    """Partial update for PATCH /partner/price-list/{catalog_item_id}."""

    model_config = ConfigDict(extra="forbid")

    is_offered: bool | None = None


class PartnerPriceListBulkPut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PartnerPriceItemUpsert] = Field(min_length=1, max_length=500)


class ApplySuggestedResult(BaseModel):
    created: int
    skipped_existing: int
    total_active_catalog: int
