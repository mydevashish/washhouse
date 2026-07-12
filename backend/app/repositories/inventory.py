"""Order inventory persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import OrderInventory


class InventoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_order(self, order_id: UUID) -> OrderInventory | None:
        result = await self._session.execute(
            select(OrderInventory).where(OrderInventory.order_id == order_id),
        )
        return result.scalar_one_or_none()

    async def upsert(self, row: OrderInventory) -> OrderInventory:
        self._session.add(row)
        await self._session.flush()
        return row
