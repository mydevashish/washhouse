"""Create platform_catalog_items + laundry_item_prices.

Revision ID: 20260717_0034
Revises: 20260714_0033
Create Date: 2026-07-17 06:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260717_0034"
down_revision = "20260714_0033"
branch_labels = None
depends_on = None


def _create_enum_if_not_exists(name: str, values_sql: str) -> None:
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({values_sql});
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )


catalog_category = postgresql.ENUM(
    "laundry_by_kg",
    "men",
    "women",
    "kids",
    "winter",
    "household",
    name="catalog_category",
    create_type=False,
)

catalog_unit = postgresql.ENUM(
    "piece",
    "kg",
    "panel",
    "set",
    "pair",
    name="catalog_unit",
    create_type=False,
)


def upgrade() -> None:
    _create_enum_if_not_exists(
        "catalog_category",
        "'laundry_by_kg', 'men', 'women', 'kids', 'winter', 'household'",
    )
    _create_enum_if_not_exists(
        "catalog_unit",
        "'piece', 'kg', 'panel', 'set', 'pair'",
    )

    op.create_table(
        "platform_catalog_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("category", catalog_category, nullable=False),
        sa.Column("unit", catalog_unit, nullable=False, server_default="piece"),
        sa.Column("suggested_dry_clean_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("suggested_press_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("suggested_price_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("slug", name="uq_platform_catalog_items_slug"),
        sa.CheckConstraint(
            "("
            "  (suggested_price_inr IS NOT NULL"
            "   AND suggested_dry_clean_inr IS NULL"
            "   AND suggested_press_inr IS NULL)"
            "  OR (suggested_price_inr IS NULL)"
            ")",
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
    )
    op.create_index(
        "ix_platform_catalog_items_category_sort",
        "platform_catalog_items",
        ["category", "sort_order"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "laundry_item_prices",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "laundry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "catalog_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("platform_catalog_items.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("dry_clean_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("press_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("price_inr", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("is_offered", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.CheckConstraint(
            "("
            "  (price_inr IS NOT NULL AND dry_clean_inr IS NULL AND press_inr IS NULL)"
            "  OR (price_inr IS NULL)"
            ")",
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
    )
    op.create_index("ix_laundry_item_prices_laundry_id", "laundry_item_prices", ["laundry_id"])
    op.create_index(
        "ix_laundry_item_prices_catalog_item_id",
        "laundry_item_prices",
        ["catalog_item_id"],
    )
    op.create_index(
        "uq_laundry_item_prices_laundry_catalog_active",
        "laundry_item_prices",
        ["laundry_id", "catalog_item_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_laundry_item_prices_laundry_catalog_active",
        table_name="laundry_item_prices",
    )
    op.drop_index("ix_laundry_item_prices_catalog_item_id", table_name="laundry_item_prices")
    op.drop_index("ix_laundry_item_prices_laundry_id", table_name="laundry_item_prices")
    op.drop_table("laundry_item_prices")

    op.drop_index(
        "ix_platform_catalog_items_category_sort",
        table_name="platform_catalog_items",
    )
    op.drop_table("platform_catalog_items")

    op.execute("DROP TYPE IF EXISTS catalog_unit")
    op.execute("DROP TYPE IF EXISTS catalog_category")
