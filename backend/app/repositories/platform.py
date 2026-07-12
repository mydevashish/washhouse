"""Platform settings persistence."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.platform import PlatformSetting


class PlatformRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, key: str) -> PlatformSetting | None:
        result = await self._session.execute(
            select(PlatformSetting).where(PlatformSetting.key == key),
        )
        return result.scalar_one_or_none()

    async def set(self, key: str, value: str) -> PlatformSetting:
        row = await self.get(key)
        if row:
            row.value = value
        else:
            row = PlatformSetting(key=key, value=value)
            self._session.add(row)
        await self._session.flush()
        return row

    async def get_default_commission(self) -> Decimal:
        row = await self.get(PlatformSetting.default_commission_key())
        if not row:
            return Decimal("10")
        return Decimal(row.value)
