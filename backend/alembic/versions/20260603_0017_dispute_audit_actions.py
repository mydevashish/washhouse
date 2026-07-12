"""Add dispute audit_action enum values.

Revision ID: 20260603_0017
Revises: 20260603_0016
"""

from __future__ import annotations

from alembic import op

revision = "20260603_0017"
down_revision = "20260603_0016"
branch_labels = None
depends_on = None

_DISPUTE_AUDIT_ACTIONS = (
    "dispute_status_change",
    "dispute_assigned",
    "dispute_note_added",
    "dispute_bulk_action",
    "dispute_escalated",
    "dispute_closed",
)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        for value in _DISPUTE_AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    pass
