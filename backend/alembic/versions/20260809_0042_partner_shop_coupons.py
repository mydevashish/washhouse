"""Partner shop-scoped coupons + order discount columns.

Revision ID: 20260809_0042
Revises: 20260808_0041
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260809_0042"
down_revision = "20260808_0041"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("coupons_code_key", "coupons", type_="unique")
    op.add_column(
        "coupons",
        sa.Column(
            "laundry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundries.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_coupons_laundry_id", "coupons", ["laundry_id"])
    op.create_unique_constraint("uq_coupons_laundry_code", "coupons", ["laundry_id", "code"])

    op.add_column("orders", sa.Column("coupon_code", sa.String(32), nullable=True))
    op.add_column(
        "orders",
        sa.Column("discount_inr", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("orders", "discount_inr")
    op.drop_column("orders", "coupon_code")
    op.drop_constraint("uq_coupons_laundry_code", "coupons", type_="unique")
    op.drop_index("ix_coupons_laundry_id", table_name="coupons")
    op.drop_column("coupons", "laundry_id")
    op.create_unique_constraint("coupons_code_key", "coupons", ["code"])
