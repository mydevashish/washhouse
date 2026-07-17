"""Platform catalog + laundry item price persistence."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import CatalogCategory, LaundryStatus
from app.models.laundry import Laundry

# Stable seed slugs used for discovery compare affordances (Slice 5).
COMPARE_WASH_FOLD_SLUG = "kg-wash-fold"
COMPARE_SHIRT_SLUG = "men-shirt-tshirt"


@dataclass(frozen=True, slots=True)
class LaundryComparePriceHints:
    """Owner-set compare prices for laundry list cards (null when not offered)."""

    wash_fold_inr: Decimal | None = None
    shirt_dry_clean_inr: Decimal | None = None

    @property
    def start_price_inr(self) -> Decimal | None:
        values = [v for v in (self.wash_fold_inr, self.shirt_dry_clean_inr) if v is not None]
        return min(values) if values else None


class CatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_item_by_slug(self, slug: str) -> PlatformCatalogItem | None:
        return await self._session.scalar(
            select(PlatformCatalogItem).where(
                PlatformCatalogItem.slug == slug,
                PlatformCatalogItem.deleted_at.is_(None),
            ),
        )

    async def get_item_by_id(self, item_id: UUID) -> PlatformCatalogItem | None:
        return await self._session.scalar(
            select(PlatformCatalogItem).where(
                PlatformCatalogItem.id == item_id,
                PlatformCatalogItem.deleted_at.is_(None),
            ),
        )

    async def get_items_by_ids(self, item_ids: list[UUID]) -> list[PlatformCatalogItem]:
        if not item_ids:
            return []
        result = await self._session.scalars(
            select(PlatformCatalogItem).where(
                PlatformCatalogItem.id.in_(item_ids),
                PlatformCatalogItem.deleted_at.is_(None),
            ),
        )
        return list(result.all())

    async def list_active_items(
        self,
        *,
        category: CatalogCategory | None = None,
    ) -> list[PlatformCatalogItem]:
        q = (
            select(PlatformCatalogItem)
            .where(
                PlatformCatalogItem.deleted_at.is_(None),
                PlatformCatalogItem.is_active.is_(True),
            )
            .order_by(PlatformCatalogItem.category, PlatformCatalogItem.sort_order)
        )
        if category is not None:
            q = q.where(PlatformCatalogItem.category == category)
        result = await self._session.scalars(q)
        return list(result.all())

    async def create_item(self, item: PlatformCatalogItem) -> PlatformCatalogItem:
        self._session.add(item)
        await self._session.flush()
        return item

    async def get_laundry_price(
        self,
        laundry_id: UUID,
        catalog_item_id: UUID,
    ) -> LaundryItemPrice | None:
        return await self._session.scalar(
            select(LaundryItemPrice).where(
                LaundryItemPrice.laundry_id == laundry_id,
                LaundryItemPrice.catalog_item_id == catalog_item_id,
                LaundryItemPrice.deleted_at.is_(None),
            ),
        )

    async def list_laundry_prices(self, laundry_id: UUID) -> list[LaundryItemPrice]:
        result = await self._session.scalars(
            select(LaundryItemPrice)
            .where(
                LaundryItemPrice.laundry_id == laundry_id,
                LaundryItemPrice.deleted_at.is_(None),
            )
            .order_by(LaundryItemPrice.sort_order.nulls_last(), LaundryItemPrice.created_at),
        )
        return list(result.all())

    async def list_laundry_prices_map(
        self,
        laundry_id: UUID,
    ) -> dict[UUID, LaundryItemPrice]:
        rows = await self.list_laundry_prices(laundry_id)
        return {row.catalog_item_id: row for row in rows}

    async def list_offered_prices_with_catalog(
        self,
        laundry_id: UUID,
    ) -> list[tuple[PlatformCatalogItem, LaundryItemPrice]]:
        """Active catalog items this laundry offers, ordered for public tables."""
        result = await self._session.execute(
            select(PlatformCatalogItem, LaundryItemPrice)
            .join(
                LaundryItemPrice,
                LaundryItemPrice.catalog_item_id == PlatformCatalogItem.id,
            )
            .where(
                LaundryItemPrice.laundry_id == laundry_id,
                LaundryItemPrice.deleted_at.is_(None),
                LaundryItemPrice.is_offered.is_(True),
                PlatformCatalogItem.deleted_at.is_(None),
                PlatformCatalogItem.is_active.is_(True),
            )
            .order_by(
                PlatformCatalogItem.category,
                PlatformCatalogItem.sort_order,
                PlatformCatalogItem.name,
            ),
        )
        return list(result.all())

    async def create_laundry_price(self, row: LaundryItemPrice) -> LaundryItemPrice:
        self._session.add(row)
        await self._session.flush()
        return row

    async def min_offered_prices_by_catalog_item(
        self,
        *,
        category: CatalogCategory | None = None,
    ) -> dict[UUID, tuple[Decimal | None, Decimal | None, Decimal | None]]:
        """MIN dry_clean / press / price among approved laundries that offer the item.

        Returns catalog_item_id → (min_dry_clean, min_press, min_price).
        Only non-null partner columns participate in each MIN.
        """
        q = (
            select(
                LaundryItemPrice.catalog_item_id,
                func.min(LaundryItemPrice.dry_clean_inr),
                func.min(LaundryItemPrice.press_inr),
                func.min(LaundryItemPrice.price_inr),
            )
            .join(Laundry, Laundry.id == LaundryItemPrice.laundry_id)
            .join(
                PlatformCatalogItem,
                PlatformCatalogItem.id == LaundryItemPrice.catalog_item_id,
            )
            .where(
                LaundryItemPrice.deleted_at.is_(None),
                LaundryItemPrice.is_offered.is_(True),
                Laundry.deleted_at.is_(None),
                Laundry.status == LaundryStatus.approved,
                PlatformCatalogItem.deleted_at.is_(None),
                PlatformCatalogItem.is_active.is_(True),
            )
            .group_by(LaundryItemPrice.catalog_item_id)
        )
        if category is not None:
            q = q.where(PlatformCatalogItem.category == category)
        result = await self._session.execute(q)
        return {
            row[0]: (row[1], row[2], row[3])
            for row in result.all()
        }

    async def compare_price_hints_for_laundries(
        self,
        laundry_ids: list[UUID],
    ) -> dict[UUID, LaundryComparePriceHints]:
        """Batch Wash & Fold + shirt dry-clean prices for discovery cards.

        Only returns owner-set offered prices for stable seed slugs; no suggested fallback.
        """
        if not laundry_ids:
            return {}

        items = await self._session.scalars(
            select(PlatformCatalogItem).where(
                PlatformCatalogItem.slug.in_(
                    [COMPARE_WASH_FOLD_SLUG, COMPARE_SHIRT_SLUG],
                ),
                PlatformCatalogItem.deleted_at.is_(None),
                PlatformCatalogItem.is_active.is_(True),
            ),
        )
        by_slug = {item.slug: item for item in items.all()}
        wash_fold = by_slug.get(COMPARE_WASH_FOLD_SLUG)
        shirt = by_slug.get(COMPARE_SHIRT_SLUG)
        catalog_ids = [i.id for i in (wash_fold, shirt) if i is not None]
        if not catalog_ids:
            return {lid: LaundryComparePriceHints() for lid in laundry_ids}

        result = await self._session.execute(
            select(
                LaundryItemPrice.laundry_id,
                LaundryItemPrice.catalog_item_id,
                LaundryItemPrice.price_inr,
                LaundryItemPrice.dry_clean_inr,
            ).where(
                LaundryItemPrice.laundry_id.in_(laundry_ids),
                LaundryItemPrice.catalog_item_id.in_(catalog_ids),
                LaundryItemPrice.deleted_at.is_(None),
                LaundryItemPrice.is_offered.is_(True),
            ),
        )

        wash_by_laundry: dict[UUID, Decimal | None] = {}
        shirt_by_laundry: dict[UUID, Decimal | None] = {}
        for laundry_id, catalog_item_id, price_inr, dry_clean_inr in result.all():
            if wash_fold and catalog_item_id == wash_fold.id:
                wash_by_laundry[laundry_id] = price_inr
            elif shirt and catalog_item_id == shirt.id:
                shirt_by_laundry[laundry_id] = dry_clean_inr

        return {
            lid: LaundryComparePriceHints(
                wash_fold_inr=wash_by_laundry.get(lid),
                shirt_dry_clean_inr=shirt_by_laundry.get(lid),
            )
            for lid in laundry_ids
        }
