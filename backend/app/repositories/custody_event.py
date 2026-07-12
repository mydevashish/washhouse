"""Chain-of-custody event persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custody_event import OrderCustodyEvent


class CustodyEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, row: OrderCustodyEvent) -> OrderCustodyEvent:
        self._session.add(row)
        await self._session.flush()
        return row

    async def list_by_order(self, order_id: UUID) -> list[OrderCustodyEvent]:
        result = await self._session.execute(
            select(OrderCustodyEvent)
            .where(OrderCustodyEvent.order_id == order_id)
            .order_by(OrderCustodyEvent.created_at.asc()),
        )
        return list(result.scalars().all())
