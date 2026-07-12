"""OTP code persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OtpPurpose
from app.models.otp_code import OtpCode


class OtpRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_latest_valid_for_user(self, user_id: UUID, purpose: OtpPurpose) -> OtpCode | None:
        now = datetime.now(UTC)
        result = await self._session.execute(
            select(OtpCode)
            .where(
                OtpCode.user_id == user_id,
                OtpCode.purpose == purpose,
                OtpCode.consumed_at.is_(None),
                OtpCode.expires_at > now,
            )
            .order_by(OtpCode.created_at.desc())
            .limit(1),
        )
        return result.scalar_one_or_none()

    async def get_latest_valid(self, phone: str, purpose: OtpPurpose) -> OtpCode | None:
        now = datetime.now(UTC)
        result = await self._session.execute(
            select(OtpCode)
            .where(
                OtpCode.phone == phone,
                OtpCode.purpose == purpose,
                OtpCode.consumed_at.is_(None),
                OtpCode.expires_at > now,
            )
            .order_by(OtpCode.created_at.desc())
            .limit(1),
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        phone: str,
        code_hash: str,
        purpose: OtpPurpose,
        expires_at: datetime,
        user_id: UUID | None = None,
    ) -> OtpCode:
        otp = OtpCode(
            phone=phone,
            code_hash=code_hash,
            purpose=purpose,
            expires_at=expires_at,
            user_id=user_id,
        )
        self._session.add(otp)
        await self._session.flush()
        return otp

    async def consume(self, otp: OtpCode) -> None:
        otp.consumed_at = datetime.now(UTC)
        await self._session.flush()

    async def increment_attempts(self, otp: OtpCode) -> None:
        otp.attempts += 1
        await self._session.flush()
