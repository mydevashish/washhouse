"""Store partner create-order intake snapshot on orders.

Revision ID: 20260912_0047
Revises: 20260912_0046
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "20260912_0047"
down_revision = "20260912_0046"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    return column in {col["name"] for col in inspect(bind).get_columns(table)}


def upgrade() -> None:
    if not _has_column("orders", "intake_snapshot"):
        op.add_column("orders", sa.Column("intake_snapshot", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    if _has_column("orders", "intake_snapshot"):
        op.drop_column("orders", "intake_snapshot")
