"""Add wallet_balance to laundry_customers.

Revision ID: 20260915_0050
Revises: 20260914_0049
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "20260915_0050"
down_revision = "20260914_0049"
branch_labels = None
depends_on = None


def _has_column(column: str) -> bool:
    return column in {item["name"] for item in inspect(op.get_bind()).get_columns("laundry_customers")}


def upgrade() -> None:
    # Add wallet_balance with default 0 to avoid nulls on existing rows
    if not _has_column("wallet_balance"):
        op.add_column(
            "laundry_customers",
            sa.Column("wallet_balance", sa.Integer(), nullable=False, server_default="0"),
        )


def downgrade() -> None:
    if _has_column("wallet_balance"):
        op.drop_column("laundry_customers", "wallet_balance")
