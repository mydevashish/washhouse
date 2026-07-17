"""Laundry discovery and partner registration."""

from __future__ import annotations

import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete_pattern, cache_get_json, cache_set_json
from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.repositories.catalog import CatalogRepository, LaundryComparePriceHints
from app.repositories.laundry import LaundryRepository
from app.repositories.laundry_search import LaundrySearchRepository, SearchSort
from app.repositories.user import UserRepository
from app.schemas.laundry import LaundryListItem, LaundrySearchItem, LaundrySearchResult
from app.utils.money import format_inr, inr_to_paise

# v2 includes compare price hints on list/search cards (Slice 5).
_LIST_CACHE_PREFIX = "laundries:list:v2:"
_SEARCH_CACHE_PREFIX = "laundries:search:v2:"


async def invalidate_laundry_discovery_cache() -> None:
    """Drop list/search caches after partner prices (or laundry status) change."""
    await cache_delete_pattern(_LIST_CACHE_PREFIX)
    await cache_delete_pattern(_SEARCH_CACHE_PREFIX)
    # Legacy keys from before Slice 5
    await cache_delete_pattern("laundries:list:v1:")
    await cache_delete_pattern("laundries:search:v1:")


class LaundryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._search = LaundrySearchRepository(session)
        self._users = UserRepository(session)
        self._catalog = CatalogRepository(session)

    def _list_item_fields(
        self,
        laundry: Laundry,
        hints: LaundryComparePriceHints | None = None,
    ) -> dict:
        h = hints or LaundryComparePriceHints()
        start = h.start_price_inr
        return {
            "id": laundry.id,
            "name": laundry.name,
            "slug": laundry.slug,
            "city": laundry.city,
            "avg_rating": laundry.avg_rating,
            "review_count": laundry.review_count,
            "is_verified": laundry.is_verified,
            "wash_fold_from_inr": format_inr(h.wash_fold_inr),
            "wash_fold_from_paise": inr_to_paise(h.wash_fold_inr),
            "shirt_dry_clean_from_inr": format_inr(h.shirt_dry_clean_inr),
            "shirt_dry_clean_from_paise": inr_to_paise(h.shirt_dry_clean_inr),
            "start_price_inr": format_inr(start),
            "start_price_paise": inr_to_paise(start),
        }

    def _to_list_item(
        self,
        laundry: Laundry,
        hints: LaundryComparePriceHints | None = None,
    ) -> LaundryListItem:
        return LaundryListItem(**self._list_item_fields(laundry, hints))

    def _to_search_item(
        self,
        laundry: Laundry,
        hints: LaundryComparePriceHints | None = None,
        *,
        rank_score: float,
    ) -> LaundrySearchItem:
        return LaundrySearchItem(
            **self._list_item_fields(laundry, hints),
            rank_score=rank_score,
        )

    async def _hints_map(
        self,
        laundry_ids: list[UUID],
    ) -> dict[UUID, LaundryComparePriceHints]:
        return await self._catalog.compare_price_hints_for_laundries(laundry_ids)

    async def list_public(
        self,
        *,
        city: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[LaundryListItem]:
        cache_key = f"{_LIST_CACHE_PREFIX}{city or ''}:{limit}:{offset}"
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return [LaundryListItem.model_validate(row) for row in cached]

        rows = await self._laundries.list_approved(city=city, limit=limit, offset=offset)
        hints = await self._hints_map([r.id for r in rows])
        items = [self._to_list_item(r, hints.get(r.id)) for r in rows]
        await cache_set_json(
            cache_key,
            [item.model_dump(mode="json") for item in items],
            ttl_seconds=settings.CACHE_LAUNDRIES_LIST_TTL_SEC,
        )
        return items

    async def search_public(
        self,
        *,
        query: str,
        city: str | None = None,
        min_rating: float | None = None,
        sort: SearchSort = "relevance",
        limit: int = 20,
        offset: int = 0,
    ) -> LaundrySearchResult:
        from decimal import Decimal

        cache_key = (
            f"{_SEARCH_CACHE_PREFIX}{query}:{city or ''}:{min_rating}:{sort}:{limit}:{offset}"
        )
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return LaundrySearchResult.model_validate(cached)

        page = await self._search.search_approved(
            query=query,
            city=city,
            min_rating=Decimal(str(min_rating)) if min_rating is not None else None,
            sort=sort,
            limit=limit,
            offset=offset,
        )
        hints = await self._hints_map([hit.laundry.id for hit in page.items])
        items = [
            self._to_search_item(
                hit.laundry,
                hints.get(hit.laundry.id),
                rank_score=round(hit.rank_score, 4),
            )
            for hit in page.items
        ]
        result = LaundrySearchResult(
            items=items,
            total=page.total,
            limit=limit,
            offset=offset,
        )
        await cache_set_json(
            cache_key,
            result.model_dump(mode="json"),
            ttl_seconds=settings.CACHE_LAUNDRIES_SEARCH_TTL_SEC,
        )
        return result

    async def get_public(self, laundry_id: UUID) -> Laundry:
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry or laundry.status != LaundryStatus.approved:
            raise NotFoundError("Laundry not found")
        return laundry

    async def register_partner_laundry(
        self,
        owner_id: UUID,
        *,
        name: str,
        city: str,
        address_line: str,
        description: str | None = None,
    ) -> Laundry:
        user = await self._users.get_by_id(owner_id)
        if not user:
            raise NotFoundError("User not found")
        if await self._laundries.get_by_owner(owner_id):
            raise ValidationError("Partner already has a laundry")
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:200]
        laundry = Laundry(
            owner_user_id=owner_id,
            name=name,
            slug=f"{slug}-{str(owner_id)[:8]}",
            city=city,
            address_line=address_line,
            description=description,
            status=LaundryStatus.pending_approval,
        )
        user.role = UserRole.partner
        await self._laundries.create(laundry)
        return laundry
