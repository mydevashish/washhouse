"""Staff suspend + work schedule.

Revision ID: 20260603_0025
Revises: 20260603_0024
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0025"
down_revision = "20260603_0024"
branch_labels = None
depends_on = None

_SUSPEND_ACTIONS = ("staff_suspended", "staff_unsuspended")


def upgrade() -> None:
    with op.get_context().autocommit_block():
        for value in _SUSPEND_ACTIONS:
            op.execute(f"ALTER TYPE staff_activity_action ADD VALUE IF NOT EXISTS '{value}'")

    op.add_column("partner_staff", sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("partner_staff", sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("partner_staff", sa.Column("suspended_reason", sa.Text(), nullable=True))
    op.add_column("partner_staff", sa.Column("work_schedule", postgresql.JSONB(), nullable=True))
    op.create_index("ix_partner_staff_is_suspended", "partner_staff", ["is_suspended"])


def downgrade() -> None:
    op.drop_index("ix_partner_staff_is_suspended", table_name="partner_staff")
    op.drop_column("partner_staff", "work_schedule")
    op.drop_column("partner_staff", "suspended_reason")
    op.drop_column("partner_staff", "suspended_at")
    op.drop_column("partner_staff", "is_suspended")
