"""Partner service catalog persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.laundry import LaundryService


class PartnerServiceCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_laundry(self, laundry_id: UUID) -> list[LaundryService]:
        rows = await self._session.scalars(
            select(LaundryService)
            .where(LaundryService.laundry_id == laundry_id, LaundryService.deleted_at.is_(None))
            .order_by(LaundryService.sort_order, LaundryService.name),
        )
        return list(rows.all())

    async def get(self, service_id: UUID, laundry_id: UUID) -> LaundryService | None:
        return await self._session.scalar(
            select(LaundryService).where(
                LaundryService.id == service_id,
                LaundryService.laundry_id == laundry_id,
                LaundryService.deleted_at.is_(None),
            ),
        )

    async def create(self, row: LaundryService) -> LaundryService:
        self._session.add(row)
        await self._session.flush()
        return row

    async def soft_delete(self, row: LaundryService) -> None:
        from datetime import UTC, datetime

        row.deleted_at = datetime.now(UTC)
        row.is_active = False
        row.catalog_status = "paused"
        await self._session.flush()
