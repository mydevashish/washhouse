"""Add laundry approve/reject audit_action enum values.

Revision ID: 20260728_0035
Revises: 20260717_0034
"""

from __future__ import annotations

from alembic import op

revision = "20260728_0035"
down_revision = "20260717_0034"
branch_labels = None
depends_on = None

_AUDIT_ACTIONS = (
    "laundry_approved",
    "laundry_rejected",
)


def upgrade() -> None:
    for value in _AUDIT_ACTIONS:
        op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # Postgres cannot remove enum values safely; leave them in place.
    pass
