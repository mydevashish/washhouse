"""Partner garment catalog business logic."""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.core.config import settings
from app.core.pagination import build_paginated_response
from app.models.enums import GarmentCategory, GarmentServiceType
from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate
from app.repositories.laundry import LaundryRepository
from app.repositories.partner_garment_catalog import PartnerGarmentCatalogRepository
from app.services.garment_catalog_import import (
    ImportParseResult,
    ParsedGarmentRow,
    build_import_summary,
    build_template_xlsx,
    parse_import_file,
)
from app.utils.money import format_inr, inr_to_paise

_PREVIEW_TTL_SECONDS = 900
_import_previews: dict[UUID, tuple[float, UUID, ImportParseResult]] = {}


def _prune_previews() -> None:
    now = time.time()
    expired = [key for key, (created_at, _, _) in _import_previews.items() if now - created_at > _PREVIEW_TTL_SECONDS]
    for key in expired:
        _import_previews.pop(key, None)


def _rates_map(item: LaundryGarmentItem) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for rate in item.service_rates:
        if rate.deleted_at is not None or rate.price_inr is None:
            continue
        out[rate.service_type.value] = {
            "price_inr": format_inr(rate.price_inr),
            "price_paise": inr_to_paise(rate.price_inr),
        }
    return out


def _serialize_item(item: LaundryGarmentItem, *, resolved_image_url: str | None = None) -> dict[str, Any]:
    return {
        "id": item.id,
        "laundry_id": item.laundry_id,
        "category": item.category.value,
        "name": item.name,
        "garment_code": item.garment_code,
        "image_url": item.image_url,
        "resolved_image_url": resolved_image_url,
        "platform_catalog_item_id": item.platform_catalog_item_id,
        "is_visible": item.is_visible,
        "sort_order": item.sort_order,
        "rates": _rates_map(item),
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def _validate_garment_code(code: str) -> str:
    cleaned = code.strip()
    if not cleaned:
        raise ValidationError("Garment code is required")
    if len(cleaned) > 20:
        raise ValidationError("Garment code must be at most 20 characters")
    if not cleaned.replace("-", "").replace("_", "").isalnum():
        raise ValidationError("Garment code must be alphanumeric (hyphens/underscores allowed)")
    return cleaned


def _normalize_rate_inputs(
    rates: dict[str, Decimal | float | int | str | None] | None,
) -> dict[GarmentServiceType, Decimal | None]:
    if not rates:
        return {}
    out: dict[GarmentServiceType, Decimal | None] = {}
    for key, raw in rates.items():
        try:
            service_type = GarmentServiceType(key)
        except ValueError as exc:
            raise ValidationError(f"Unknown service type '{key}'") from exc
        if raw is None or raw == "":
            out[service_type] = None
            continue
        value = Decimal(str(raw))
        if value < 0:
            raise ValidationError(f"{service_type.value} price cannot be negative")
        if value == 0:
            out[service_type] = None
        else:
            out[service_type] = value.quantize(Decimal("0.01"))
    return out


class PartnerGarmentCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._repo = PartnerGarmentCatalogRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found for this partner")
        return laundry

    def resolve_image_fallback(self, item: LaundryGarmentItem) -> str | None:
        if item.image_url:
            return item.image_url
        return None

    async def list_garments(
        self,
        partner_user_id: UUID,
        *,
        category: GarmentCategory | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        rows, total = await self._repo.list_for_laundry_paginated(
            laundry.id,
            category=category,
            search=search,
            page=page,
            page_size=page_size,
        )
        items = [
            _serialize_item(row, resolved_image_url=self.resolve_image_fallback(row))
            for row in rows
        ]
        return build_paginated_response(
            items=items,
            total_records=total,
            page=max(1, page),
            page_size=max(1, min(page_size, 100)),
        )

    async def summary(self, partner_user_id: UUID) -> dict[str, int]:
        laundry = await self._laundry_for_partner(partner_user_id)
        return await self._repo.summary_counts(laundry.id)

    async def get_garment(self, partner_user_id: UUID, garment_id: UUID) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(garment_id, laundry.id)
        if not row:
            raise NotFoundError("Garment not found")
        return _serialize_item(row, resolved_image_url=self.resolve_image_fallback(row))

    async def create_garment(self, partner_user_id: UUID, body: dict[str, Any]) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        code = _validate_garment_code(body["garment_code"])
        if await self._repo.get_by_code(laundry.id, code):
            raise ValidationError(f"Garment code '{code}' already exists")

        try:
            category = GarmentCategory(body["category"])
        except ValueError as exc:
            raise ValidationError("Invalid category") from exc

        name = str(body["name"]).strip()
        if not name:
            raise ValidationError("Garment name is required")

        item = LaundryGarmentItem(
            laundry_id=laundry.id,
            category=category,
            name=name,
            garment_code=code,
            image_url=body.get("image_url"),
            platform_catalog_item_id=body.get("platform_catalog_item_id"),
            is_visible=bool(body.get("is_visible", True)),
            sort_order=int(body.get("sort_order") or 0),
        )
        created = await self._repo.create(item)
        rates = _normalize_rate_inputs(body.get("rates"))
        if rates:
            await self._repo.replace_rates(created, rates)
        await self._session.refresh(created, attribute_names=["service_rates"])
        return _serialize_item(created, resolved_image_url=self.resolve_image_fallback(created))

    async def update_garment(
        self,
        partner_user_id: UUID,
        garment_id: UUID,
        body: dict[str, Any],
    ) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(garment_id, laundry.id)
        if not row:
            raise NotFoundError("Garment not found")

        if "garment_code" in body and body["garment_code"] is not None:
            code = _validate_garment_code(body["garment_code"])
            existing = await self._repo.get_by_code(laundry.id, code)
            if existing and existing.id != row.id:
                raise ValidationError(f"Garment code '{code}' already exists")
            row.garment_code = code

        if "name" in body and body["name"] is not None:
            name = str(body["name"]).strip()
            if not name:
                raise ValidationError("Garment name is required")
            row.name = name

        if "category" in body and body["category"] is not None:
            try:
                row.category = GarmentCategory(body["category"])
            except ValueError as exc:
                raise ValidationError("Invalid category") from exc

        if "image_url" in body:
            row.image_url = body["image_url"]
        if "platform_catalog_item_id" in body:
            row.platform_catalog_item_id = body["platform_catalog_item_id"]
        if "is_visible" in body and body["is_visible"] is not None:
            row.is_visible = bool(body["is_visible"])
        if "sort_order" in body and body["sort_order"] is not None:
            row.sort_order = int(body["sort_order"])

        if "rates" in body and body["rates"] is not None:
            await self._repo.replace_rates(row, _normalize_rate_inputs(body["rates"]))

        await self._session.flush()
        await self._session.refresh(row, attribute_names=["service_rates"])
        return _serialize_item(row, resolved_image_url=self.resolve_image_fallback(row))

    async def delete_garment(self, partner_user_id: UUID, garment_id: UUID) -> None:
        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(garment_id, laundry.id)
        if not row:
            raise NotFoundError("Garment not found")
        await self._repo.soft_delete_item(row)

    async def bulk_delete(
        self,
        partner_user_id: UUID,
        *,
        ids: list[UUID] | None = None,
        category: GarmentCategory | None = None,
        delete_all: bool = False,
        confirm: str | None = None,
    ) -> dict[str, int]:
        laundry = await self._laundry_for_partner(partner_user_id)
        selected = sum(1 for flag in (ids, category, delete_all) if flag)
        if selected != 1:
            raise ValidationError("Provide exactly one of ids, category, or all=true")

        if delete_all:
            if confirm != "DELETE":
                raise ValidationError("Type DELETE to confirm deleting the entire catalog")
            deleted = await self._repo.soft_delete_all(laundry.id)
        elif category is not None:
            deleted = await self._repo.soft_delete_by_category(laundry.id, category)
        else:
            assert ids is not None
            deleted = await self._repo.soft_delete_by_ids(laundry.id, ids)
        return {"deleted_count": deleted}

    async def import_preview(
        self,
        partner_user_id: UUID,
        file_bytes: bytes,
        filename: str,
    ) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        try:
            parsed = parse_import_file(file_bytes, filename)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        existing_codes = await self._repo.list_active_codes(laundry.id)
        summary = build_import_summary(parsed, existing_codes=existing_codes)
        preview_id = uuid4()
        _prune_previews()
        _import_previews[preview_id] = (time.time(), laundry.id, parsed)

        return {
            "preview_id": preview_id,
            "summary": summary,
            "valid_rows": [
                {
                    "row_number": row.row_number,
                    "garment_code": row.garment_code,
                    "name": row.name,
                    "category": row.category.value,
                    "is_visible": row.is_visible,
                    "rates": {k.value: float(v) for k, v in row.rates.items()},
                }
                for row in parsed.valid_rows
            ],
            "error_rows": [
                {
                    "row_number": err.row_number,
                    "garment_code": err.garment_code,
                    "name": err.name,
                    "errors": err.errors,
                }
                for err in parsed.error_rows
            ],
        }

    async def import_confirm(
        self,
        partner_user_id: UUID,
        *,
        preview_id: UUID,
        mode: str = "upsert",
        skip_invalid: bool = True,
    ) -> dict[str, Any]:
        laundry = await self._laundry_for_partner(partner_user_id)
        _prune_previews()
        cached = _import_previews.get(preview_id)
        if not cached:
            raise NotFoundError("Import preview expired or not found")
        _, preview_laundry_id, parsed = cached
        if preview_laundry_id != laundry.id:
            raise ValidationError("Import preview does not belong to this laundry")

        if not skip_invalid and parsed.error_rows:
            raise ValidationError("Fix invalid rows before importing")

        rows = parsed.valid_rows
        if mode == "replace_all":
            await self._repo.soft_delete_all(laundry.id)
        elif mode == "replace_categories_in_file":
            categories = {row.category for row in rows}
            await self._repo.soft_delete_by_categories(laundry.id, categories)
        elif mode != "upsert":
            raise ValidationError("Invalid import mode")

        created = 0
        updated = 0
        for row in rows:
            was_update = await self._upsert_import_row(laundry.id, row)
            if was_update:
                updated += 1
            else:
                created += 1

        _import_previews.pop(preview_id, None)
        return {
            "imported_count": len(rows),
            "created_count": created,
            "updated_count": updated,
            "skipped_error_count": len(parsed.error_rows),
        }

    async def _upsert_import_row(self, laundry_id: UUID, row: ParsedGarmentRow) -> bool:
        existing = await self._repo.get_by_code(laundry_id, row.garment_code)
        if existing is None:
            item = LaundryGarmentItem(
                laundry_id=laundry_id,
                category=row.category,
                name=row.name,
                garment_code=row.garment_code,
                is_visible=row.is_visible,
                sort_order=max(0, row.row_number - 2),
            )
            created = await self._repo.create(item)
            await self._repo.set_rates_from_import(created, row.rates)
            return False

        existing.category = row.category
        existing.name = row.name
        existing.is_visible = row.is_visible
        existing.sort_order = max(0, row.row_number - 2)
        await self._repo.set_rates_from_import(existing, row.rates)
        await self._session.flush()
        return True

    async def export_template(self) -> bytes:
        return build_template_xlsx()

    async def upload_garment_image(
        self,
        partner_user_id: UUID,
        garment_id: UUID,
        file_bytes: bytes,
        content_type: str,
    ) -> dict[str, Any]:
        from uuid import uuid4

        laundry = await self._laundry_for_partner(partner_user_id)
        row = await self._repo.get(garment_id, laundry.id)
        if not row:
            raise NotFoundError("Garment not found")

        ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(content_type, ".jpg")
        filename = f"{uuid4()}{ext}"
        dest_dir = settings.storefront_upload_path / str(laundry.id)
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / filename
        dest.write_bytes(file_bytes)
        url = f"/api/v1/media/storefront/{laundry.id}/{filename}"
        row.image_url = url
        await self._session.flush()
        await self._session.refresh(row, attribute_names=["service_rates"])
        garment = _serialize_item(row, resolved_image_url=url)
        return {"url": url, "garment": garment}
