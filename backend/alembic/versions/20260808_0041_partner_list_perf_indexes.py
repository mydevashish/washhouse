"""Partner order bucket + laundry trust list indexes.

Revision ID: 20260808_0041
Revises: 20260808_0040
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260808_0041"
down_revision = "20260808_0040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_orders_laundry_id_status_created_at",
        "orders",
        ["laundry_id", "status", "created_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_laundries_trust_score_active",
        "laundries",
        ["trust_score"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_laundries_trust_score_active", table_name="laundries")
    op.drop_index("ix_orders_laundry_id_status_created_at", table_name="orders")
