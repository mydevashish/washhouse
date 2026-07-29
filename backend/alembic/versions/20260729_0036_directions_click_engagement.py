"""Add directions_click to engagement_event_type.

Revision ID: 20260729_0036
Revises: 20260728_0035
"""

from __future__ import annotations

from alembic import op

revision = "20260729_0036"
down_revision = "20260728_0035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE engagement_event_type ADD VALUE IF NOT EXISTS 'directions_click'")


def downgrade() -> None:
    # Postgres cannot remove enum values safely; leave them in place.
    pass
