"""Create laundry_garment_items + laundry_garment_service_rates.

Revision ID: 20260814_0044
Revises: 20260810_0043
Create Date: 2026-08-14 14:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "20260814_0044"
down_revision = "20260810_0043"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return name in inspect(bind).get_table_names()


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


garment_category = postgresql.ENUM(
    "men",
    "women",
    "kids",
    "household",
    "institutional",
    "others",
    name="garment_category",
    create_type=False,
)

garment_service_type = postgresql.ENUM(
    "commercial_service",
    "dry_cleaning",
    "express_service",
    "on_hanger",
    "lint_remover",
    "premium_laundry",
    "shoe_cleaning",
    "steam_press",
    "starch",
    "wash_and_fold",
    "wash_n_iron",
    name="garment_service_type",
    create_type=False,
)


def upgrade() -> None:
    _create_enum_if_not_exists(
        "garment_category",
        "'men', 'women', 'kids', 'household', 'institutional', 'others'",
    )
    _create_enum_if_not_exists(
        "garment_service_type",
        "'commercial_service', 'dry_cleaning', 'express_service', 'on_hanger', "
        "'lint_remover', 'premium_laundry', 'shoe_cleaning', 'steam_press', "
        "'starch', 'wash_and_fold', 'wash_n_iron'",
    )

    if _has_table("laundry_garment_items"):
        return

    op.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

    op.create_table(
        "laundry_garment_items",
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
        sa.Column("category", garment_category, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("garment_code", sa.String(20), nullable=False),
        sa.Column("image_url", sa.String(2000), nullable=True),
        sa.Column(
            "platform_catalog_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("platform_catalog_items.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
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
    )
    op.create_index(
        "ix_laundry_garment_items_laundry_id",
        "laundry_garment_items",
        ["laundry_id"],
    )
    op.create_index(
        "ix_laundry_garment_items_platform_catalog_item_id",
        "laundry_garment_items",
        ["platform_catalog_item_id"],
    )
    op.create_index(
        "ix_laundry_garment_items_laundry_category",
        "laundry_garment_items",
        ["laundry_id", "category"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_laundry_garment_items_laundry_visible",
        "laundry_garment_items",
        ["laundry_id", "is_visible"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "uq_laundry_garment_items_laundry_code_active",
        "laundry_garment_items",
        ["laundry_id", sa.text("lower(garment_code)")],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "laundry_garment_service_rates",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "garment_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundry_garment_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("service_type", garment_service_type, nullable=False),
        sa.Column("price_inr", sa.Numeric(12, 2), nullable=True),
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
            "price_inr IS NULL OR price_inr >= 0",
            name="ck_laundry_garment_service_rates_price_nonneg",
        ),
    )
    op.create_index(
        "ix_laundry_garment_service_rates_garment_item_id",
        "laundry_garment_service_rates",
        ["garment_item_id"],
    )
    op.create_index(
        "uq_laundry_garment_rates_item_type_active",
        "laundry_garment_service_rates",
        ["garment_item_id", "service_type"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_laundry_garment_rates_item_type_active",
        table_name="laundry_garment_service_rates",
    )
    op.drop_index(
        "ix_laundry_garment_service_rates_garment_item_id",
        table_name="laundry_garment_service_rates",
    )
    op.drop_table("laundry_garment_service_rates")

    op.drop_index(
        "uq_laundry_garment_items_laundry_code_active",
        table_name="laundry_garment_items",
    )
    op.drop_index(
        "ix_laundry_garment_items_laundry_visible",
        table_name="laundry_garment_items",
    )
    op.drop_index(
        "ix_laundry_garment_items_laundry_category",
        table_name="laundry_garment_items",
    )
    op.drop_index(
        "ix_laundry_garment_items_platform_catalog_item_id",
        table_name="laundry_garment_items",
    )
    op.drop_index(
        "ix_laundry_garment_items_laundry_id",
        table_name="laundry_garment_items",
    )
    op.drop_table("laundry_garment_items")

    op.execute("DROP TYPE IF EXISTS garment_service_type")
    op.execute("DROP TYPE IF EXISTS garment_category")
