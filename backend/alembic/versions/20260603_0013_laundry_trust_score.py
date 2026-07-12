"""Laundry trust score column on laundries.

Revision ID: 20260603_0013
Revises: 20260603_0012
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260603_0013"
down_revision = "20260603_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "laundries",
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="70"),
    )
    op.execute("UPDATE laundries SET trust_score = 70 WHERE trust_score IS NULL")


def downgrade() -> None:
    op.drop_column("laundries", "trust_score")
