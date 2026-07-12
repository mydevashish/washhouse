"""Platform configuration persistence."""

from __future__ import annotations

import json
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.platform_config_keys import PLATFORM_CONFIG_DEFAULTS
from app.models.partner_commission_override import PartnerCommissionOverride
from app.models.platform import PlatformSetting
from app.models.user import User


class PlatformConfigRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_raw(self, key: str) -> str | None:
        row = await self._session.scalar(select(PlatformSetting).where(PlatformSetting.key == key))
        return row.value if row else None

    async def get(self, key: str) -> str:
        val = await self.get_raw(key)
        if val is not None:
            return val
        return PLATFORM_CONFIG_DEFAULTS.get(key, "")

    async def set(self, key: str, value: str) -> None:
        row = await self._session.scalar(select(PlatformSetting).where(PlatformSetting.key == key))
        if row:
            row.value = value
        else:
            self._session.add(PlatformSetting(key=key, value=value))
        await self._session.flush()

    async def get_many(self, keys: list[str]) -> dict[str, str]:
        result = await self._session.scalars(select(PlatformSetting).where(PlatformSetting.key.in_(keys)))
        found = {r.key: r.value for r in result.all()}
        out: dict[str, str] = {}
        for key in keys:
            out[key] = found.get(key, PLATFORM_CONFIG_DEFAULTS.get(key, ""))
        return out

    async def get_partner_override(self, user_id: UUID) -> PartnerCommissionOverride | None:
        return await self._session.get(PartnerCommissionOverride, user_id)

    async def list_partner_overrides(self) -> list[tuple[PartnerCommissionOverride, User]]:
        result = await self._session.execute(
            select(PartnerCommissionOverride, User)
            .join(User, User.id == PartnerCommissionOverride.user_id)
            .order_by(User.full_name.asc()),
        )
        return list(result.all())

    async def set_partner_override(self, user_id: UUID, rate: Decimal) -> PartnerCommissionOverride:
        row = await self.get_partner_override(user_id)
        if row:
            row.commission_rate = rate
        else:
            row = PartnerCommissionOverride(user_id=user_id, commission_rate=rate)
            self._session.add(row)
        await self._session.flush()
        return row

    async def delete_partner_override(self, user_id: UUID) -> None:
        row = await self.get_partner_override(user_id)
        if row:
            await self._session.delete(row)
            await self._session.flush()

    async def get_partner_by_email(self, email: str) -> User | None:
        return await self._session.scalar(
            select(User).where(User.email == email.strip().lower(), User.deleted_at.is_(None)),
        )

    @staticmethod
    def parse_bool(value: str) -> bool:
        return value.strip().lower() in ("true", "1", "yes", "on")

    @staticmethod
    def parse_json(value: str) -> dict:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return {}
