"""Laundry-scoped customer registrations for partner counter add-customer.

Revision ID: 20260810_0043
Revises: 20260809_0042
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "20260810_0043"
down_revision = "20260809_0042"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return name in inspect(bind).get_table_names()


def upgrade() -> None:
    if _has_table("laundry_customer_registrations"):
        return

    op.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

    op.create_table(
        "laundry_customer_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "laundry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "registered_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("laundry_id", "user_id", name="uq_laundry_customer_registrations_laundry_user"),
    )
    op.create_index(
        "ix_laundry_customer_registrations_laundry_id",
        "laundry_customer_registrations",
        ["laundry_id"],
    )
    op.create_index(
        "ix_laundry_customer_registrations_user_id",
        "laundry_customer_registrations",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_laundry_customer_registrations_user_id", table_name="laundry_customer_registrations")
    op.drop_index("ix_laundry_customer_registrations_laundry_id", table_name="laundry_customer_registrations")
    op.drop_table("laundry_customer_registrations")
