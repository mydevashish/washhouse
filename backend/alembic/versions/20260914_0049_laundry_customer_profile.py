"""Add partner-managed profile fields to shop customers.

Revision ID: 20260914_0049
Revises: 20260913_0048
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "20260914_0049"
down_revision = "20260913_0048"
branch_labels = None
depends_on = None


def _has_column(column: str) -> bool:
    return column in {item["name"] for item in inspect(op.get_bind()).get_columns("laundry_customers")}


def upgrade() -> None:
    columns = (
        ("title", sa.String(length=10)),
        ("plan_name", sa.String(length=80)),
        ("address_line1", sa.String(length=255)),
        ("address_line2", sa.String(length=255)),
        ("city", sa.String(length=100)),
        ("state", sa.String(length=100)),
        ("pincode", sa.String(length=10)),
    )
    for name, column_type in columns:
        if not _has_column(name):
            op.add_column("laundry_customers", sa.Column(name, column_type, nullable=True))


def downgrade() -> None:
    for name in ("pincode", "state", "city", "address_line2", "address_line1", "plan_name", "title"):
        if _has_column(name):
            op.drop_column("laundry_customers", name)
