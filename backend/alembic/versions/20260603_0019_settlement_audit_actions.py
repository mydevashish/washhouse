"""Add settlement audit_action enum values.

Revision ID: 20260603_0019
Revises: 20260603_0018
"""

from __future__ import annotations

from alembic import op

revision = "20260603_0019"
down_revision = "20260603_0018"
branch_labels = None
depends_on = None

_SETTLEMENT_AUDIT_ACTIONS = (
    "settlement_created",
    "settlement_approved",
    "settlement_rejected",
    "settlement_payout_released",
    "settlement_adjustment",
    "settlement_status_change",
)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        for value in _SETTLEMENT_AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    pass
