"""Walk-in order persistence queries."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrderSource
from app.models.order import Order


class WalkInOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_laundry(self, laundry_id: UUID, *, limit: int = 50) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.order_source == OrderSource.walk_in,
                Order.deleted_at.is_(None),
            )
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())
