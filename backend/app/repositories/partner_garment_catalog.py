"""Partner garment catalog persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import GarmentCategory, GarmentServiceType
from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate


class PartnerGarmentCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _active_item_filters(self, laundry_id: UUID):
        return (
            LaundryGarmentItem.laundry_id == laundry_id,
            LaundryGarmentItem.deleted_at.is_(None),
        )

    async def list_for_laundry_paginated(
        self,
        laundry_id: UUID,
        *,
        category: GarmentCategory | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[LaundryGarmentItem], int]:
        clauses = list(self._active_item_filters(laundry_id))
        if category is not None:
            clauses.append(LaundryGarmentItem.category == category)
        if search:
            pattern = f"%{search.strip()}%"
            clauses.append(
                or_(
                    LaundryGarmentItem.name.ilike(pattern),
                    LaundryGarmentItem.garment_code.ilike(pattern),
                ),
            )

        base = (
            select(LaundryGarmentItem)
            .where(*clauses)
            .options(selectinload(LaundryGarmentItem.service_rates))
            .order_by(LaundryGarmentItem.sort_order, LaundryGarmentItem.name)
        )
        count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)
        safe_page = max(1, page)
        safe_size = max(1, min(page_size, 100))
        rows = await self._session.scalars(
            base.offset((safe_page - 1) * safe_size).limit(safe_size),
        )
        return list(rows.all()), total

    async def summary_counts(self, laundry_id: UUID) -> dict[str, int]:
        total = int(
            await self._session.scalar(
                select(func.count())
                .select_from(LaundryGarmentItem)
                .where(*self._active_item_filters(laundry_id)),
            )
            or 0,
        )
        visible = int(
            await self._session.scalar(
                select(func.count())
                .select_from(LaundryGarmentItem)
                .where(
                    *self._active_item_filters(laundry_id),
                    LaundryGarmentItem.is_visible.is_(True),
                ),
            )
            or 0,
        )
        categories = int(
            await self._session.scalar(
                select(func.count(func.distinct(LaundryGarmentItem.category))).where(
                    *self._active_item_filters(laundry_id),
                ),
            )
            or 0,
        )
        return {"total": total, "visible": visible, "categories": categories}

    async def list_active_codes(self, laundry_id: UUID) -> set[str]:
        rows = await self._session.scalars(
            select(LaundryGarmentItem.garment_code).where(*self._active_item_filters(laundry_id)),
        )
        return {code.lower() for code in rows.all()}

    async def get(self, garment_id: UUID, laundry_id: UUID) -> LaundryGarmentItem | None:
        return await self._session.scalar(
            select(LaundryGarmentItem)
            .where(
                LaundryGarmentItem.id == garment_id,
                *self._active_item_filters(laundry_id),
            )
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )

    async def get_by_code(self, laundry_id: UUID, garment_code: str) -> LaundryGarmentItem | None:
        normalized = garment_code.strip().lower()
        return await self._session.scalar(
            select(LaundryGarmentItem)
            .where(
                LaundryGarmentItem.laundry_id == laundry_id,
                LaundryGarmentItem.deleted_at.is_(None),
                func.lower(LaundryGarmentItem.garment_code) == normalized,
            )
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )

    async def create(self, item: LaundryGarmentItem) -> LaundryGarmentItem:
        self._session.add(item)
        await self._session.flush()
        return item

    async def soft_delete_item(self, item: LaundryGarmentItem) -> None:
        now = datetime.now(UTC)
        item.deleted_at = now
        for rate in item.service_rates:
            if rate.deleted_at is None:
                rate.deleted_at = now
        await self._session.flush()

    async def set_visible_by_ids(self, laundry_id: UUID, ids: list[UUID], *, is_visible: bool) -> int:
        if not ids:
            return 0
        rows = await self._session.scalars(
            select(LaundryGarmentItem).where(
                LaundryGarmentItem.id.in_(ids),
                *self._active_item_filters(laundry_id),
            ),
        )
        count = 0
        for row in rows.all():
            if row.is_visible != is_visible:
                row.is_visible = is_visible
                count += 1
        if count:
            await self._session.flush()
        return count

    async def soft_delete_by_ids(self, laundry_id: UUID, ids: list[UUID]) -> int:
        if not ids:
            return 0
        rows = await self._session.scalars(
            select(LaundryGarmentItem)
            .where(
                LaundryGarmentItem.id.in_(ids),
                *self._active_item_filters(laundry_id),
            )
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )
        count = 0
        for row in rows.all():
            await self.soft_delete_item(row)
            count += 1
        return count

    async def soft_delete_by_category(self, laundry_id: UUID, category: GarmentCategory) -> int:
        rows = await self._session.scalars(
            select(LaundryGarmentItem)
            .where(
                *self._active_item_filters(laundry_id),
                LaundryGarmentItem.category == category,
            )
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )
        count = 0
        for row in rows.all():
            await self.soft_delete_item(row)
            count += 1
        return count

    async def soft_delete_all(self, laundry_id: UUID) -> int:
        rows = await self._session.scalars(
            select(LaundryGarmentItem)
            .where(*self._active_item_filters(laundry_id))
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )
        count = 0
        for row in rows.all():
            await self.soft_delete_item(row)
            count += 1
        return count

    async def soft_delete_by_categories(self, laundry_id: UUID, categories: set[GarmentCategory]) -> int:
        if not categories:
            return 0
        rows = await self._session.scalars(
            select(LaundryGarmentItem)
            .where(
                *self._active_item_filters(laundry_id),
                LaundryGarmentItem.category.in_(categories),
            )
            .options(selectinload(LaundryGarmentItem.service_rates)),
        )
        count = 0
        for row in rows.all():
            await self.soft_delete_item(row)
            count += 1
        return count

    async def _list_active_rates(self, garment_item_id: UUID) -> list[LaundryGarmentServiceRate]:
        rows = await self._session.scalars(
            select(LaundryGarmentServiceRate).where(
                LaundryGarmentServiceRate.garment_item_id == garment_item_id,
                LaundryGarmentServiceRate.deleted_at.is_(None),
            ),
        )
        return list(rows.all())

    async def set_rates_from_import(
        self,
        item: LaundryGarmentItem,
        rates: dict[GarmentServiceType, Decimal],
    ) -> None:
        """Replace all active rates with import row prices (omitted types are not offered)."""
        now = datetime.now(UTC)
        for rate in await self._list_active_rates(item.id):
            rate.deleted_at = now
        for service_type, price in rates.items():
            self._session.add(
                LaundryGarmentServiceRate(
                    garment_item_id=item.id,
                    service_type=service_type,
                    price_inr=price,
                ),
            )
        await self._session.flush()

    async def replace_rates(
        self,
        item: LaundryGarmentItem,
        rates: dict[GarmentServiceType, Decimal | None],
    ) -> None:
        now = datetime.now(UTC)
        active_by_type = {rate.service_type: rate for rate in await self._list_active_rates(item.id)}
        for service_type, price in rates.items():
            if price is None or price <= Decimal("0"):
                existing = active_by_type.get(service_type)
                if existing is not None:
                    existing.deleted_at = now
                continue
            existing = active_by_type.get(service_type)
            if existing is not None:
                existing.price_inr = price
                existing.deleted_at = None
            else:
                self._session.add(
                    LaundryGarmentServiceRate(
                        garment_item_id=item.id,
                        service_type=service_type,
                        price_inr=price,
                    ),
                )
        await self._session.flush()
