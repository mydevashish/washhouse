"""Partner garment price-list business logic.

Owns laundry-scoped reads/writes against platform_catalog_items + laundry_item_prices.
Does not touch laundry_services / order line items (Slice E bridge deferred).
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ErrorDetail, NotFoundError, ValidationError
from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import CatalogCategory
from app.repositories.catalog import CatalogRepository
from app.repositories.laundry import LaundryRepository
from app.schemas.partner_price_list import (
    ApplySuggestedResult,
    PartnerPriceItemPatch,
    PartnerPriceItemUpsert,
    PartnerPriceListItemOut,
    PartnerPriceListResponse,
)
from app.services.catalog_pricing import catalog_allows_press, catalog_price_mode
from app.services.laundry_price_list_service import invalidate_public_price_list_cache
from app.services.laundry_service import invalidate_laundry_discovery_cache
from app.services.marketplace_from_service import invalidate_marketplace_from_cache
from app.utils.money import format_inr, inr_to_paise

log = structlog.get_logger(__name__)


def _serialize_row(
    item: PlatformCatalogItem,
    override: LaundryItemPrice | None,
) -> PartnerPriceListItemOut:
    mode = catalog_price_mode(item)
    return PartnerPriceListItemOut(
        catalog_item_id=item.id,
        slug=item.slug,
        name=item.name,
        category=item.category,
        unit=item.unit,
        sort_order=item.sort_order,
        currency=item.currency,
        suggested_dry_clean_inr=format_inr(item.suggested_dry_clean_inr),
        suggested_press_inr=format_inr(item.suggested_press_inr),
        suggested_price_inr=format_inr(item.suggested_price_inr),
        suggested_dry_clean_paise=inr_to_paise(item.suggested_dry_clean_inr),
        suggested_press_paise=inr_to_paise(item.suggested_press_inr),
        suggested_price_paise=inr_to_paise(item.suggested_price_inr),
        dry_clean_inr=format_inr(override.dry_clean_inr) if override else None,
        press_inr=format_inr(override.press_inr) if override else None,
        price_inr=format_inr(override.price_inr) if override else None,
        dry_clean_paise=inr_to_paise(override.dry_clean_inr) if override else None,
        press_paise=inr_to_paise(override.press_inr) if override else None,
        price_paise=inr_to_paise(override.price_inr) if override else None,
        is_offered=override.is_offered if override else None,
        has_override=override is not None,
        allows_press=catalog_allows_press(item),
        price_mode=mode,
    )


class PartnerPriceListService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._catalog = CatalogRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found for this partner")
        return laundry

    async def get_price_list(
        self,
        partner_user_id: UUID,
        *,
        category: CatalogCategory | None = None,
    ) -> PartnerPriceListResponse:
        laundry = await self._laundry_for_partner(partner_user_id)
        items = await self._catalog.list_active_items(category=category)
        overrides = await self._catalog.list_laundry_prices_map(laundry.id)
        rows = [_serialize_row(item, overrides.get(item.id)) for item in items]
        offered = sum(1 for r in rows if r.is_offered is True)
        return PartnerPriceListResponse(
            items=rows,
            offered_count=offered,
            total_catalog_items=len(rows),
        )

    async def bulk_upsert(
        self,
        partner_user_id: UUID,
        payloads: list[PartnerPriceItemUpsert],
    ) -> PartnerPriceListResponse:
        laundry = await self._laundry_for_partner(partner_user_id)
        updates = [
            (p.catalog_item_id, p.model_dump(exclude={"catalog_item_id"}))
            for p in payloads
        ]
        await self._apply_updates(laundry.id, updates, replace_prices=True)
        await invalidate_public_price_list_cache(laundry.id)
        await invalidate_marketplace_from_cache()
        await invalidate_laundry_discovery_cache()
        log.info(
            "partner.price_list.saved",
            laundry_id=str(laundry.id),
            partner_user_id=str(partner_user_id),
            updated=len(payloads),
        )
        return await self.get_price_list(partner_user_id)

    async def patch_item(
        self,
        partner_user_id: UUID,
        catalog_item_id: UUID,
        payload: PartnerPriceItemPatch,
    ) -> PartnerPriceListItemOut:
        laundry = await self._laundry_for_partner(partner_user_id)
        fields = payload.model_dump(exclude_unset=True)
        await self._apply_updates(
            laundry.id,
            [(catalog_item_id, fields)],
            replace_prices=False,
        )
        await invalidate_public_price_list_cache(laundry.id)
        await invalidate_marketplace_from_cache()
        await invalidate_laundry_discovery_cache()
        log.info(
            "partner.price_list.saved",
            laundry_id=str(laundry.id),
            partner_user_id=str(partner_user_id),
            updated=1,
            catalog_item_id=str(catalog_item_id),
        )
        result = await self.get_price_list(partner_user_id)
        for row in result.items:
            if row.catalog_item_id == catalog_item_id:
                return row
        raise NotFoundError("Catalog item not found")

    async def _apply_updates(
        self,
        laundry_id: UUID,
        updates: list[tuple[UUID, dict[str, Any]]],
        *,
        replace_prices: bool,
    ) -> None:
        catalog_ids = [cid for cid, _ in updates]
        catalog_items = await self._catalog.get_items_by_ids(catalog_ids)
        by_id = {item.id: item for item in catalog_items}

        missing = [cid for cid in catalog_ids if cid not in by_id]
        if missing:
            raise NotFoundError(
                "Catalog item not found",
                details=[ErrorDetail(field="catalog_item_id", issue=str(cid)) for cid in missing],
            )

        for cat_item in catalog_items:
            if not cat_item.is_active:
                raise ValidationError(
                    "Cannot price inactive catalog items",
                    details=[ErrorDetail(field="catalog_item_id", issue=str(cat_item.id))],
                )

        overrides = await self._catalog.list_laundry_prices_map(laundry_id)
        for catalog_item_id, fields in updates:
            item = by_id[catalog_item_id]
            existing = overrides.get(item.id)
            self._validate_upsert(item, fields, existing=existing, replace_prices=replace_prices)
            if existing is None:
                row = LaundryItemPrice(
                    laundry_id=laundry_id,
                    catalog_item_id=item.id,
                )
                self._apply_fields(row, fields, replace_prices=replace_prices)
                await self._catalog.create_laundry_price(row)
                overrides[item.id] = row
            else:
                self._apply_fields(existing, fields, replace_prices=replace_prices)
                await self._session.flush()

    async def apply_suggested(self, partner_user_id: UUID) -> ApplySuggestedResult:
        """Copy suggested prices into missing laundry_item_prices rows (idempotent)."""
        laundry = await self._laundry_for_partner(partner_user_id)
        items = await self._catalog.list_active_items()
        overrides = await self._catalog.list_laundry_prices_map(laundry.id)

        created = 0
        skipped = 0
        for item in items:
            if item.id in overrides:
                skipped += 1
                continue
            dry, press, single = (
                item.suggested_dry_clean_inr,
                item.suggested_press_inr,
                item.suggested_price_inr,
            )
            has_money = dry is not None or press is not None or single is not None
            row = LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=item.id,
                dry_clean_inr=dry,
                press_inr=press,
                price_inr=single,
                is_offered=has_money,
                sort_order=item.sort_order,
            )
            await self._catalog.create_laundry_price(row)
            created += 1

        if created > 0:
            await invalidate_public_price_list_cache(laundry.id)
            await invalidate_marketplace_from_cache()
            await invalidate_laundry_discovery_cache()

        log.info(
            "partner.price_list.apply_suggested",
            laundry_id=str(laundry.id),
            partner_user_id=str(partner_user_id),
            created=created,
            skipped_existing=skipped,
        )
        return ApplySuggestedResult(
            created=created,
            skipped_existing=skipped,
            total_active_catalog=len(items),
        )

    def _validate_upsert(
        self,
        item: PlatformCatalogItem,
        fields: dict[str, Any],
        *,
        existing: LaundryItemPrice | None,
        replace_prices: bool,
    ) -> None:
        mode = catalog_price_mode(item)
        allows_press = catalog_allows_press(item)
        details: list[ErrorDetail] = []

        if fields.get("press_inr") is not None and not allows_press:
            details.append(
                ErrorDetail(
                    field="press_inr",
                    issue="Catalog item does not support a press price",
                ),
            )

        if mode == "single":
            if fields.get("dry_clean_inr") is not None or fields.get("press_inr") is not None:
                details.append(
                    ErrorDetail(
                        field="dry_clean_inr",
                        issue="This catalog item uses a single price_inr rate",
                    ),
                )
        elif mode == "dual":
            if fields.get("price_inr") is not None:
                details.append(
                    ErrorDetail(
                        field="price_inr",
                        issue="This catalog item uses dry_clean_inr/press_inr, not price_inr",
                    ),
                )

        is_offered = fields.get(
            "is_offered",
            existing.is_offered if existing is not None else True,
        )

        dry = existing.dry_clean_inr if existing else None
        press = existing.press_inr if existing else None
        single = existing.price_inr if existing else None

        if replace_prices or ("dry_clean_inr" in fields or "press_inr" in fields or "price_inr" in fields):
            if fields.get("price_inr") is not None:
                dry, press, single = None, None, fields.get("price_inr")
            elif "dry_clean_inr" in fields or "press_inr" in fields or replace_prices:
                dry = fields.get("dry_clean_inr") if ("dry_clean_inr" in fields or replace_prices) else dry
                press = fields.get("press_inr") if ("press_inr" in fields or replace_prices) else press
                if replace_prices or "dry_clean_inr" in fields or "press_inr" in fields:
                    single = None
            elif replace_prices:
                dry, press, single = None, None, None

        if is_offered and dry is None and press is None and single is None:
            details.append(
                ErrorDetail(
                    field="is_offered",
                    issue="At least one price is required when is_offered is true",
                ),
            )

        if details:
            raise ValidationError("Invalid price-list update", details=details)

    def _apply_fields(
        self,
        row: LaundryItemPrice,
        fields: dict[str, Any],
        *,
        replace_prices: bool,
    ) -> None:
        money_keys = {"dry_clean_inr", "press_inr", "price_inr"}
        touching_money = bool(money_keys & fields.keys()) or replace_prices

        if touching_money:
            if fields.get("price_inr") is not None:
                row.price_inr = fields["price_inr"]
                row.dry_clean_inr = None
                row.press_inr = None
            elif "dry_clean_inr" in fields or "press_inr" in fields or replace_prices:
                if replace_prices or "dry_clean_inr" in fields:
                    row.dry_clean_inr = fields.get("dry_clean_inr")
                if replace_prices or "press_inr" in fields:
                    row.press_inr = fields.get("press_inr")
                row.price_inr = None

        if "is_offered" in fields:
            row.is_offered = bool(fields["is_offered"])
        elif replace_prices:
            row.is_offered = True
        if "sort_order" in fields and fields["sort_order"] is not None:
            row.sort_order = fields["sort_order"]
