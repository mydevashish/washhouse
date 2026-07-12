"""Partner staff persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.partner_staff import PartnerStaff


class StaffRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_laundry(self, laundry_id: UUID) -> list[PartnerStaff]:
        result = await self._session.execute(
            select(PartnerStaff).where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
            ),
        )
        return list(result.scalars().all())

    async def get_by_id(self, staff_id: UUID, laundry_id: UUID) -> PartnerStaff | None:
        result = await self._session.execute(
            select(PartnerStaff).where(
                PartnerStaff.id == staff_id,
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
            ),
        )
        return result.scalar_one_or_none()

    async def create(self, staff: PartnerStaff) -> PartnerStaff:
        self._session.add(staff)
        await self._session.flush()
        return staff

    async def soft_delete(self, staff: PartnerStaff) -> None:
        from datetime import UTC, datetime

        staff.deleted_at = datetime.now(UTC)
        await self._session.flush()
