"""Settlement on_hold status and hold audit actions.

Revision ID: 20260603_0024
Revises: 20260603_0023
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260603_0024"
down_revision = "20260603_0023"
branch_labels = None
depends_on = None

_HOLD_AUDIT_ACTIONS = (
    "settlement_held",
    "settlement_released_from_hold",
)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE settlement_status ADD VALUE IF NOT EXISTS 'on_hold'")
        for value in _HOLD_AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")

    op.add_column("settlements", sa.Column("held_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("settlements", sa.Column("held_reason", sa.Text(), nullable=True))
    op.add_column("settlements", sa.Column("status_before_hold", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("settlements", "status_before_hold")
    op.drop_column("settlements", "held_reason")
    op.drop_column("settlements", "held_at")
