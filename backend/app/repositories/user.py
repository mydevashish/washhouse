"""User persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.email == email.lower(), User.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.phone == phone, User.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        email: str | None,
        phone: str | None,
        password_hash: str | None,
        full_name: str,
        role: UserRole = UserRole.customer,
        is_phone_verified: bool = False,
    ) -> User:
        user = User(
            email=email.lower() if email else None,
            phone=phone,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
            is_phone_verified=is_phone_verified,
        )
        self._session.add(user)
        await self._session.flush()
        return user

    async def update(self, user: User) -> User:
        await self._session.flush()
        return user
