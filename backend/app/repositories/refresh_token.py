"""Refresh token persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.jti == jti),
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: UUID,
        jti: str,
        expires_at: datetime,
        family_id: UUID | None = None,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            jti=jti,
            family_id=family_id or uuid4(),
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def mark_used(self, token: RefreshToken) -> None:
        token.used_at = datetime.now(UTC)
        await self._session.flush()

    async def revoke_family(self, family_id: UUID) -> None:
        now = datetime.now(UTC)
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now),
        )

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        now = datetime.now(UTC)
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now),
        )
