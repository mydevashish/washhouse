"""User address persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_address import UserAddress


class AddressRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: UUID) -> list[UserAddress]:
        result = await self._session.execute(
            select(UserAddress)
            .where(UserAddress.user_id == user_id)
            .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc()),
        )
        return list(result.scalars().all())

    async def get_by_id(self, address_id: UUID, user_id: UUID) -> UserAddress | None:
        result = await self._session.execute(
            select(UserAddress).where(
                UserAddress.id == address_id,
                UserAddress.user_id == user_id,
            ),
        )
        return result.scalar_one_or_none()

    async def create(self, address: UserAddress) -> UserAddress:
        self._session.add(address)
        await self._session.flush()
        return address

    async def clear_default(self, user_id: UUID) -> None:
        await self._session.execute(
            update(UserAddress).where(UserAddress.user_id == user_id).values(is_default=False),
        )

    async def delete(self, address: UserAddress) -> None:
        await self._session.delete(address)
        await self._session.flush()
