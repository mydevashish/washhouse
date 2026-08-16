"""Partner service catalog persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.laundry import LaundryService


class PartnerServiceCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_laundry(self, laundry_id: UUID) -> list[LaundryService]:
        rows, _ = await self.list_for_laundry_paginated(laundry_id, page=1, page_size=10_000)
        return rows

    async def list_for_laundry_paginated(
        self,
        laundry_id: UUID,
        *,
        search: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[LaundryService], int]:
        clauses = [
            LaundryService.laundry_id == laundry_id,
            LaundryService.deleted_at.is_(None),
        ]
        if search:
            pattern = f"%{search.strip()}%"
            clauses.append(
                or_(
                    LaundryService.name.ilike(pattern),
                    LaundryService.category.ilike(pattern),
                ),
            )

        base = (
            select(LaundryService)
            .where(*clauses)
            .order_by(LaundryService.sort_order, LaundryService.name)
        )
        count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)
        safe_page = max(1, page)
        safe_size = max(1, min(page_size, 100))
        rows = await self._session.scalars(
            base.offset((safe_page - 1) * safe_size).limit(safe_size),
        )
        return list(rows.all()), total

    async def get(self, service_id: UUID, laundry_id: UUID) -> LaundryService | None:
        return await self._session.scalar(
            select(LaundryService).where(
                LaundryService.id == service_id,
                LaundryService.laundry_id == laundry_id,
                LaundryService.deleted_at.is_(None),
            ),
        )

    async def get_by_catalog_bridge(
        self,
        laundry_id: UUID,
        *,
        catalog_item_id: UUID,
        process: str,
    ) -> LaundryService | None:
        """Find a laundry_service created for a Cloth Wall catalog line."""
        marker = f"catalog:{catalog_item_id}:{process}"
        return await self._session.scalar(
            select(LaundryService).where(
                LaundryService.laundry_id == laundry_id,
                LaundryService.description == marker,
                LaundryService.deleted_at.is_(None),
            ),
        )

    async def get_by_garment_bridge(
        self,
        laundry_id: UUID,
        *,
        garment_item_id: UUID,
        process: str,
    ) -> LaundryService | None:
        """Find a laundry_service created for a partner garment rate-card line."""
        marker = f"garment:{garment_item_id}:{process}"
        return await self._session.scalar(
            select(LaundryService).where(
                LaundryService.laundry_id == laundry_id,
                LaundryService.description == marker,
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
