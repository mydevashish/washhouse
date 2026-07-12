"""Laundry storefront persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.storefront import LaundryStorefront


class StorefrontRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_laundry(self, laundry_id: UUID) -> LaundryStorefront | None:
        result = await self._session.execute(
            select(LaundryStorefront).where(LaundryStorefront.laundry_id == laundry_id),
        )
        return result.scalar_one_or_none()

    async def upsert(self, row: LaundryStorefront) -> LaundryStorefront:
        existing = await self.get_by_laundry(row.laundry_id)
        if existing:
            for key in (
                "template_id",
                "is_published",
                "logo_url",
                "cover_url",
                "brand_primary",
                "brand_secondary",
                "tagline",
                "brand_story",
                "years_in_business",
                "owner_name",
                "contact_phone",
                "whatsapp_number",
                "show_call",
                "show_whatsapp",
                "show_callback",
                "approval_status",
                "working_hours",
                "pickup_radius_km",
                "delivery_radius_km",
                "facilities",
                "highlights",
                "gallery",
                "machines",
                "team",
                "certifications",
                "videos",
                "completeness_score",
            ):
                setattr(existing, key, getattr(row, key))
            await self._session.flush()
            return existing
        self._session.add(row)
        await self._session.flush()
        return row

    async def count_completed_orders(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.laundry_id == laundry_id, Order.status == OrderStatus.delivered),
        )
        return int(result.scalar_one() or 0)

    async def list_by_approval_status(self, status: str) -> list[LaundryStorefront]:
        rows = await self._session.scalars(
            select(LaundryStorefront).where(LaundryStorefront.approval_status == status),
        )
        return list(rows.all())
