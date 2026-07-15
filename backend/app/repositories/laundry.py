"""Laundry persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import LaundryStatus
from app.models.laundry import Laundry, LaundryService


class LaundryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_approved(
        self,
        *,
        city: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Laundry]:
        q = (
            select(Laundry)
            .where(
                Laundry.deleted_at.is_(None),
                Laundry.status == LaundryStatus.approved,
            )
            .order_by(desc(Laundry.avg_rating), asc(Laundry.name))
            .limit(limit)
            .offset(offset)
        )
        if city:
            q = q.where(Laundry.city.ilike(f"%{city.strip()}%"))
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def get_by_id(self, laundry_id: UUID) -> Laundry | None:
        result = await self._session.execute(
            select(Laundry)
            .where(Laundry.id == laundry_id, Laundry.deleted_at.is_(None))
            .options(selectinload(Laundry.services)),
        )
        return result.scalar_one_or_none()

    async def get_by_owner(self, owner_id: UUID) -> Laundry | None:
        result = await self._session.execute(
            select(Laundry)
            .where(Laundry.owner_user_id == owner_id, Laundry.deleted_at.is_(None))
            .order_by(Laundry.created_at.asc())
            .limit(1),
        )
        return result.scalars().first()

    async def list_by_owner(self, owner_id: UUID) -> list[Laundry]:
        result = await self._session.execute(
            select(Laundry)
            .where(Laundry.owner_user_id == owner_id, Laundry.deleted_at.is_(None))
            .order_by(Laundry.created_at.asc()),
        )
        return list(result.scalars().all())

    async def create(self, laundry: Laundry) -> Laundry:
        self._session.add(laundry)
        await self._session.flush()
        return laundry
