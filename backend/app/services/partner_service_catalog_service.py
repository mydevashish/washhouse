"""Partner service catalog business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.laundry import LaundryService
from app.repositories.laundry import LaundryRepository
from app.repositories.partner_service_catalog import PartnerServiceCatalogRepository


def _serialize(row: LaundryService) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "category": row.category,
        "unit": row.unit,
        "price_inr": row.price_inr,
        "description": row.description,
        "estimated_duration_minutes": row.estimated_duration_minutes,
        "express_available": row.express_available,
        "pickup_available": row.pickup_available,
        "delivery_available": row.delivery_available,
        "catalog_status": row.catalog_status,
        "view_count": row.view_count,
        "order_count": row.order_count,
        "sort_order": row.sort_order,
        "is_active": row.is_active,
    }


class PartnerServiceCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._repo = PartnerServiceCatalogRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found for this partner")
        return laundry

    async def list_services(self, partner_user_id: UUID) -> list[dict]:
        laundry = await self._laundry_for_partner(partner_user_id)
        rows = await self._repo.list_for_laundry(laundry.id)
        return [_serialize(r) for r in rows]

    async def create_service(self, partner_user_id: UUID, body: dict) -> dict:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = LaundryService(
            laundry_id=laundry.id,
            name=body["name"].strip(),
            category=body["category"].strip(),
            unit=body.get("unit") or "piece",
            price_inr=body["price_inr"],
            description=body.get("description"),
            estimated_duration_minutes=body.get("estimated_duration_minutes"),
            express_available=body.get("express_available", False),
            pickup_available=body.get("pickup_available", True),
            delivery_available=body.get("delivery_available", True),
            catalog_status=body.get("catalog_status", "active"),
            sort_order=body.get("sort_order", 0),
            is_active=body.get("catalog_status", "active") == "active",
        )
        created = await self._repo.create(row)
        return _serialize(created)

    async def update_service(self, partner_user_id: UUID, service_id: UUID, body: dict) -> dict:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(service_id, laundry.id)
        if not row:
            raise NotFoundError("Service not found")
        for key, value in body.items():
            if value is not None and hasattr(row, key):
                setattr(row, key, value.strip() if key == "name" and isinstance(value, str) else value)
        if "catalog_status" in body and body["catalog_status"] is not None:
            row.is_active = body["catalog_status"] == "active"
        await self._session.flush()
        return _serialize(row)

    async def delete_service(self, partner_user_id: UUID, service_id: UUID) -> None:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(service_id, laundry.id)
        if not row:
            raise NotFoundError("Service not found")
        await self._repo.soft_delete(row)
