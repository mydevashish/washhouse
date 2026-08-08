"""Walk-in order persistence queries."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrderSource
from app.models.order import Order


class WalkInOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _base_where(self, laundry_id: UUID, *, search: str | None = None):
        filters = [
            Order.laundry_id == laundry_id,
            Order.order_source == OrderSource.walk_in,
            Order.deleted_at.is_(None),
        ]
        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    Order.customer_name.ilike(term),
                    Order.customer_phone.ilike(term),
                    Order.tracking_code.ilike(term),
                    Order.token_code.ilike(term),
                ),
            )
        return filters

    async def count_by_laundry(self, laundry_id: UUID, *, search: str | None = None) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Order).where(*self._base_where(laundry_id, search=search)),
        )
        return int(result.scalar_one() or 0)

    async def list_by_laundry(
        self,
        laundry_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
        search: str | None = None,
    ) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .where(*self._base_where(laundry_id, search=search))
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(limit)
            .offset(offset),
        )
        return list(result.scalars().all())
