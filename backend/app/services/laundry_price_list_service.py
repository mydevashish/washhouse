"""Public laundry garment price-list reads (offered items only)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete_pattern, cache_get_json, cache_set_json
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import LaundryStatus
from app.repositories.catalog import CatalogRepository
from app.repositories.laundry import LaundryRepository
from app.schemas.laundry_price_list import (
    PublicLaundryPriceListItemOut,
    PublicLaundryPriceListResponse,
)
from app.services.catalog_pricing import catalog_price_mode
from app.utils.money import format_inr, inr_to_paise

CACHE_KEY_PREFIX = "laundries:price-list:v1:"


def public_price_list_cache_key(laundry_id: UUID) -> str:
    return f"{CACHE_KEY_PREFIX}{laundry_id}"


async def invalidate_public_price_list_cache(laundry_id: UUID) -> None:
    await cache_delete_pattern(public_price_list_cache_key(laundry_id))


def _serialize_public_row(
    item: PlatformCatalogItem,
    override: LaundryItemPrice,
) -> PublicLaundryPriceListItemOut:
    return PublicLaundryPriceListItemOut(
        catalog_item_id=item.id,
        slug=item.slug,
        name=item.name,
        category=item.category,
        unit=item.unit,
        sort_order=item.sort_order,
        currency=override.currency or item.currency or "INR",
        price_mode=catalog_price_mode(item),
        dry_clean_inr=format_inr(override.dry_clean_inr),
        press_inr=format_inr(override.press_inr),
        price_inr=format_inr(override.price_inr),
        dry_clean_paise=inr_to_paise(override.dry_clean_inr),
        press_paise=inr_to_paise(override.press_inr),
        price_paise=inr_to_paise(override.price_inr),
    )


class LaundryPriceListService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._catalog = CatalogRepository(session)

    async def get_public_price_list(self, laundry_id: UUID) -> PublicLaundryPriceListResponse:
        cache_key = public_price_list_cache_key(laundry_id)
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return PublicLaundryPriceListResponse.model_validate(cached)

        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry or laundry.status != LaundryStatus.approved:
            raise NotFoundError("Laundry not found")

        pairs = await self._catalog.list_offered_prices_with_catalog(laundry_id)
        items = [_serialize_public_row(item, override) for item, override in pairs]
        response = PublicLaundryPriceListResponse(
            laundry_id=laundry_id,
            items=items,
            item_count=len(items),
            has_published_list=len(items) > 0,
        )
        await cache_set_json(
            cache_key,
            response.model_dump(mode="json"),
            ttl_seconds=settings.CACHE_LAUNDRY_PRICE_LIST_TTL_SEC,
        )
        return response
