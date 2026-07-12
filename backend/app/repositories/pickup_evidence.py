"""Pickup evidence photo persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pickup_evidence import PickupEvidencePhoto


class PickupEvidenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_many(self, photos: list[PickupEvidencePhoto]) -> list[PickupEvidencePhoto]:
        self._session.add_all(photos)
        await self._session.flush()
        return photos

    async def count_for_order(self, order_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(PickupEvidencePhoto)
            .where(PickupEvidencePhoto.order_id == order_id),
        )
        return int(result.scalar_one())

    async def list_by_order(self, order_id: UUID) -> list[PickupEvidencePhoto]:
        result = await self._session.execute(
            select(PickupEvidencePhoto)
            .where(PickupEvidencePhoto.order_id == order_id)
            .order_by(PickupEvidencePhoto.sort_index.asc(), PickupEvidencePhoto.created_at.asc()),
        )
        return list(result.scalars().all())

    async def get_by_id(self, photo_id: UUID) -> PickupEvidencePhoto | None:
        result = await self._session.execute(
            select(PickupEvidencePhoto).where(PickupEvidencePhoto.id == photo_id),
        )
        return result.scalar_one_or_none()
