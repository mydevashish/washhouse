"""Platform commission settings."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.platform import PlatformSetting
from app.models.enums import AuditAction
from app.repositories.audit import AuditRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.platform import PlatformRepository


class PlatformService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._platform = PlatformRepository(session)
        self._laundries = LaundryRepository(session)
        self._audit = AuditRepository(session)

    async def get_default_commission(self) -> Decimal:
        return await self._platform.get_default_commission()

    async def set_default_commission(
        self,
        rate: Decimal,
        *,
        actor_user_id: UUID | None = None,
    ) -> Decimal:
        if rate < Decimal("0") or rate > Decimal("100"):
            raise ValidationError("Commission must be between 0 and 100")
        old = await self.get_default_commission()
        await self._platform.set(PlatformSetting.default_commission_key(), str(rate))
        await self._audit.log(
            action=AuditAction.role_change,
            actor_user_id=actor_user_id,
            resource_type="commission_global",
            resource_id="default",
            metadata={
                "old_value": str(old),
                "new_value": str(rate),
                "source": "admin_panel",
            },
        )
        return rate

    async def set_laundry_commission(
        self,
        laundry_id: UUID,
        rate: Decimal | None,
        *,
        actor_user_id: UUID | None = None,
    ) -> dict:
        if rate is not None and (rate < Decimal("0") or rate > Decimal("100")):
            raise ValidationError("Commission must be between 0 and 100")
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        old = laundry.commission_rate
        laundry.commission_rate = rate
        await self._session.flush()
        await self._audit.log(
            action=AuditAction.role_change,
            actor_user_id=actor_user_id,
            resource_type="laundry",
            resource_id=str(laundry_id),
            metadata={
                "old_value": str(old) if old is not None else None,
                "new_value": str(rate) if rate is not None else None,
                "source": "admin_panel",
                "event": "commission_change",
            },
        )
        return {"id": str(laundry.id), "commission_rate": str(rate) if rate is not None else None}
