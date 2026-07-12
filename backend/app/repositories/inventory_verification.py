"""Inventory verification persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import InventoryChangeRequestStatus
from app.models.inventory_verification import (
    OrderInventoryChangeRequest,
    OrderInventoryHistory,
    OrderInventoryItem,
    OrderInventoryVerification,
)


class InventoryVerificationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_order(self, order_id: UUID) -> OrderInventoryVerification | None:
        result = await self._session.execute(
            select(OrderInventoryVerification)
            .where(OrderInventoryVerification.order_id == order_id)
            .options(selectinload(OrderInventoryVerification.items)),
        )
        return result.scalar_one_or_none()

    async def save(self, verification: OrderInventoryVerification) -> OrderInventoryVerification:
        self._session.add(verification)
        await self._session.flush()
        return verification

    async def add_history(self, row: OrderInventoryHistory) -> OrderInventoryHistory:
        self._session.add(row)
        await self._session.flush()
        return row

    async def list_history(self, order_id: UUID) -> list[OrderInventoryHistory]:
        result = await self._session.execute(
            select(OrderInventoryHistory)
            .where(OrderInventoryHistory.order_id == order_id)
            .order_by(OrderInventoryHistory.created_at.asc()),
        )
        return list(result.scalars().all())

    async def get_change_request(self, request_id: UUID) -> OrderInventoryChangeRequest | None:
        result = await self._session.execute(
            select(OrderInventoryChangeRequest).where(OrderInventoryChangeRequest.id == request_id),
        )
        return result.scalar_one_or_none()

    async def list_pending_change_requests(self) -> list[OrderInventoryChangeRequest]:
        result = await self._session.execute(
            select(OrderInventoryChangeRequest)
            .where(OrderInventoryChangeRequest.status == InventoryChangeRequestStatus.pending)
            .order_by(OrderInventoryChangeRequest.created_at.asc()),
        )
        return list(result.scalars().all())

    async def save_change_request(self, row: OrderInventoryChangeRequest) -> OrderInventoryChangeRequest:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_pending_change_for_order(self, order_id: UUID) -> OrderInventoryChangeRequest | None:
        result = await self._session.execute(
            select(OrderInventoryChangeRequest).where(
                OrderInventoryChangeRequest.order_id == order_id,
                OrderInventoryChangeRequest.status == InventoryChangeRequestStatus.pending,
            ),
        )
        return result.scalar_one_or_none()
