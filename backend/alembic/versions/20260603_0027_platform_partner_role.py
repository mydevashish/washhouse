"""Platform partner role migration.

Revision ID: 20260603_0027
Revises: 20260603_0026
"""

from __future__ import annotations

from alembic import op

revision = "20260603_0027"
down_revision = "20260603_0026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_partner'")


def downgrade() -> None:
    pass
