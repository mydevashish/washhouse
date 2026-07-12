"""Performance indexes for discovery and order lists.

Revision ID: 20260602_0003
Revises: 20260601_0002
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260602_0003"
down_revision = "20260601_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_laundries_status_city_active",
        "laundries",
        ["status", "city"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_orders_user_id_created_at",
        "orders",
        ["user_id", "created_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_orders_laundry_id_created_at",
        "orders",
        ["laundry_id", "created_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_reviews_laundry_id_created_at",
        "reviews",
        ["laundry_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reviews_laundry_id_created_at", table_name="reviews")
    op.drop_index("ix_orders_laundry_id_created_at", table_name="orders")
    op.drop_index("ix_orders_user_id_created_at", table_name="orders")
    op.drop_index("ix_laundries_status_city_active", table_name="laundries")
