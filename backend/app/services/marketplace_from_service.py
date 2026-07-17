"""Marketplace “from ₹” aggregates for marketing /pricing tables."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete_pattern, cache_get_json, cache_set_json
from app.core.config import settings
from app.models.catalog import PlatformCatalogItem
from app.models.enums import CatalogCategory
from app.repositories.catalog import CatalogRepository
from app.schemas.marketplace_from import (
    MarketplaceFromItemOut,
    MarketplaceFromResponse,
    MarketplaceFromSource,
)
from app.services.catalog_pricing import catalog_price_mode
from app.utils.money import format_inr, inr_to_paise

CACHE_KEY = "catalog:marketplace-from:v1"
CACHE_KEY_CATEGORY_PREFIX = "catalog:marketplace-from:v1:category:"


def marketplace_from_cache_key(category: CatalogCategory | None = None) -> str:
    if category is None:
        return CACHE_KEY
    return f"{CACHE_KEY_CATEGORY_PREFIX}{category.value}"


async def invalidate_marketplace_from_cache() -> None:
    """Drop all marketplace-from cache keys (full + per-category)."""
    await cache_delete_pattern(CACHE_KEY)


def _coalesce_from(
    aggregate: Decimal | None,
    suggested: Decimal | None,
) -> tuple[Decimal | None, bool]:
    """Return (value, used_aggregate). Prefer partner MIN when present."""
    if aggregate is not None:
        return aggregate, True
    return suggested, False


def _serialize_item(
    item: PlatformCatalogItem,
    mins: tuple[Decimal | None, Decimal | None, Decimal | None] | None,
) -> MarketplaceFromItemOut | None:
    min_dry, min_press, min_price = mins or (None, None, None)

    dry, dry_agg = _coalesce_from(min_dry, item.suggested_dry_clean_inr)
    press, press_agg = _coalesce_from(min_press, item.suggested_press_inr)
    price, price_agg = _coalesce_from(min_price, item.suggested_price_inr)

    if dry is None and press is None and price is None:
        return None  # deferred / unpriced — hide from marketing tables

    used_aggregate = dry_agg or press_agg or price_agg
    source: MarketplaceFromSource = "aggregate" if used_aggregate else "suggested"

    return MarketplaceFromItemOut(
        catalog_item_id=item.id,
        slug=item.slug,
        name=item.name,
        category=item.category,
        unit=item.unit,
        sort_order=item.sort_order,
        currency=item.currency or "INR",
        price_mode=catalog_price_mode(item),
        source=source,
        from_dry_clean_inr=format_inr(dry),
        from_press_inr=format_inr(press),
        from_price_inr=format_inr(price),
        from_dry_clean_paise=inr_to_paise(dry),
        from_press_paise=inr_to_paise(press),
        from_price_paise=inr_to_paise(price),
    )


class MarketplaceFromService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._catalog = CatalogRepository(session)

    async def get_marketplace_from(
        self,
        *,
        category: CatalogCategory | None = None,
    ) -> MarketplaceFromResponse:
        cache_key = marketplace_from_cache_key(category)
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return MarketplaceFromResponse.model_validate(cached)

        items = await self._catalog.list_active_items(category=category)
        mins_map = await self._catalog.min_offered_prices_by_catalog_item(category=category)

        out: list[MarketplaceFromItemOut] = []
        for item in items:
            row = _serialize_item(item, mins_map.get(item.id))
            if row is not None:
                out.append(row)

        response = MarketplaceFromResponse(items=out, item_count=len(out))
        await cache_set_json(
            cache_key,
            response.model_dump(mode="json"),
            ttl_seconds=settings.CACHE_MARKETPLACE_FROM_TTL_SEC,
        )
        return response
