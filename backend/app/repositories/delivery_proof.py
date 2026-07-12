"""Delivery proof persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery_proof import DeliveryProofPhoto


class DeliveryProofRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_order(self, order_id: UUID) -> DeliveryProofPhoto | None:
        result = await self._session.execute(
            select(DeliveryProofPhoto).where(DeliveryProofPhoto.order_id == order_id),
        )
        return result.scalar_one_or_none()

    async def save(self, row: DeliveryProofPhoto) -> DeliveryProofPhoto:
        self._session.add(row)
        await self._session.flush()
        return row
