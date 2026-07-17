"""Platform master catalog + per-laundry garment price overrides."""

from __future__ import annotations

import uuid
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import CatalogCategory, CatalogUnit

# Shared money-shape CHECK: single (`price_inr`) XOR dual (`dry_clean`/`press`); all-null allowed (deferred).
_PRICE_SHAPE_SQL = (
    "("
    "  (price_inr IS NOT NULL AND dry_clean_inr IS NULL AND press_inr IS NULL)"
    "  OR (price_inr IS NULL)"
    ")"
)
_SUGGESTED_PRICE_SHAPE_SQL = (
    "("
    "  (suggested_price_inr IS NOT NULL"
    "   AND suggested_dry_clean_inr IS NULL"
    "   AND suggested_press_inr IS NULL)"
    "  OR (suggested_price_inr IS NULL)"
    ")"
)


class PlatformCatalogItem(Base, TimestampMixin, SoftDeleteMixin):
    """Platform-owned garment/service SKU with optional suggested INR defaults."""

    __tablename__ = "platform_catalog_items"
    __table_args__ = (
        sa.CheckConstraint(
            _SUGGESTED_PRICE_SHAPE_SQL,
            name="ck_platform_catalog_items_price_shape",
        ),
        sa.CheckConstraint(
            "suggested_dry_clean_inr IS NULL OR suggested_dry_clean_inr >= 0",
            name="ck_platform_catalog_items_suggested_dry_clean_nonneg",
        ),
        sa.CheckConstraint(
            "suggested_press_inr IS NULL OR suggested_press_inr >= 0",
            name="ck_platform_catalog_items_suggested_press_nonneg",
        ),
        sa.CheckConstraint(
            "suggested_price_inr IS NULL OR suggested_price_inr >= 0",
            name="ck_platform_catalog_items_suggested_price_nonneg",
        ),
        sa.Index(
            "ix_platform_catalog_items_category_sort",
            "category",
            "sort_order",
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[CatalogCategory] = mapped_column(
        Enum(CatalogCategory, name="catalog_category", native_enum=True),
        nullable=False,
    )
    unit: Mapped[CatalogUnit] = mapped_column(
        Enum(CatalogUnit, name="catalog_unit", native_enum=True),
        nullable=False,
        default=CatalogUnit.piece,
    )
    # Dual-process suggested rates (garments). press NULL when N/A ("—").
    suggested_dry_clean_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    suggested_press_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    # Single-rate suggested (laundry_by_kg + household without press split).
    suggested_price_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    laundry_prices: Mapped[list[LaundryItemPrice]] = relationship(back_populates="catalog_item")


class LaundryItemPrice(Base, TimestampMixin, SoftDeleteMixin):
    """Per-laundry override of a platform catalog item (prices + offer flag)."""

    __tablename__ = "laundry_item_prices"
    __table_args__ = (
        sa.CheckConstraint(
            _PRICE_SHAPE_SQL,
            name="ck_laundry_item_prices_price_shape",
        ),
        sa.CheckConstraint(
            "dry_clean_inr IS NULL OR dry_clean_inr >= 0",
            name="ck_laundry_item_prices_dry_clean_nonneg",
        ),
        sa.CheckConstraint(
            "press_inr IS NULL OR press_inr >= 0",
            name="ck_laundry_item_prices_press_nonneg",
        ),
        sa.CheckConstraint(
            "price_inr IS NULL OR price_inr >= 0",
            name="ck_laundry_item_prices_price_nonneg",
        ),
        sa.Index(
            "uq_laundry_item_prices_laundry_catalog_active",
            "laundry_id",
            "catalog_item_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index("ix_laundry_item_prices_laundry_id", "laundry_id"),
        sa.Index("ix_laundry_item_prices_catalog_item_id", "catalog_item_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laundry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="CASCADE"),
        nullable=False,
    )
    catalog_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_catalog_items.id", ondelete="RESTRICT"),
        nullable=False,
    )
    dry_clean_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    press_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    is_offered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True)

    catalog_item: Mapped[PlatformCatalogItem] = relationship(back_populates="laundry_prices")
