"""Add partner CRM fields on laundry_customer_registrations.

Revision ID: 20260815_0045
Revises: 20260814_0044
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "20260815_0045"
down_revision = "20260814_0044"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns(table)}
    return column in cols


def upgrade() -> None:
    if not _has_column("laundry_customer_registrations", "gender"):
        op.add_column(
            "laundry_customer_registrations",
            sa.Column("gender", sa.String(length=10), nullable=True),
        )
    if not _has_column("laundry_customer_registrations", "crm_notes"):
        op.add_column(
            "laundry_customer_registrations",
            sa.Column("crm_notes", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    if _has_column("laundry_customer_registrations", "crm_notes"):
        op.drop_column("laundry_customer_registrations", "crm_notes")
    if _has_column("laundry_customer_registrations", "gender"):
        op.drop_column("laundry_customer_registrations", "gender")
