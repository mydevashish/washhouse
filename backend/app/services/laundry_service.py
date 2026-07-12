"""Laundry discovery and partner registration."""

from __future__ import annotations

import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get_json, cache_set_json
from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.schemas.laundry import LaundryListItem
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.repositories.laundry import LaundryRepository
from app.repositories.laundry_search import LaundrySearchRepository, SearchSort
from app.repositories.user import UserRepository
from app.schemas.laundry import LaundrySearchItem, LaundrySearchResult


class LaundryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._search = LaundrySearchRepository(session)
        self._users = UserRepository(session)

    async def list_public(
        self,
        *,
        city: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[LaundryListItem]:
        cache_key = f"laundries:list:v1:{city or ''}:{limit}:{offset}"
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return [LaundryListItem.model_validate(row) for row in cached]

        rows = await self._laundries.list_approved(city=city, limit=limit, offset=offset)
        items = [LaundryListItem.model_validate(r) for r in rows]
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
            f"laundries:search:v1:{query}:{city or ''}:{min_rating}:{sort}:{limit}:{offset}"
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
        items = [
            LaundrySearchItem(
                **LaundryListItem.model_validate(hit.laundry).model_dump(),
                rank_score=round(hit.rank_score, 4),
            )
            for hit in page.items
        ]
        result = LaundrySearchResult(items=items, total=page.total, limit=limit, offset=offset)
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
