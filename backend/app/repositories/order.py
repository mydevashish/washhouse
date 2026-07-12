"""Order persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from app.models.order import Order, OrderStatusEvent


class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, order: Order) -> Order:
        self._session.add(order)
        await self._session.flush()
        return order

    async def add_event(self, event: OrderStatusEvent) -> None:
        self._session.add(event)
        await self._session.flush()

    async def get_by_id(self, order_id: UUID) -> Order | None:
        result = await self._session.execute(
            select(Order)
            .where(Order.id == order_id, Order.deleted_at.is_(None))
            .options(selectinload(Order.items), selectinload(Order.events)),
        )
        return result.scalar_one_or_none()

    async def get_by_tracking_code(self, code: str) -> Order | None:
        result = await self._session.execute(
            select(Order).where(Order.tracking_code == code, Order.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .where(Order.user_id == user_id, Order.deleted_at.is_(None))
            .order_by(Order.created_at.desc())
            .options(noload(Order.items))
            .limit(limit)
            .offset(offset),
        )
        return list(result.scalars().all())

    async def list_by_laundry(self, laundry_id: UUID) -> list[Order]:
        result = await self._session.execute(
            select(Order)
            .where(Order.laundry_id == laundry_id, Order.deleted_at.is_(None))
            .order_by(Order.created_at.desc()),
        )
        return list(result.scalars().all())
