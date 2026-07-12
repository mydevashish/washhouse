"""Add complaint assigned_at and staff assignee roles.

Revision ID: 20260603_0016
Revises: 20260603_0015
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260603_0016"
down_revision = "20260603_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support_agent'")
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_manager'")

    op.add_column(
        "complaints",
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_complaints_assigned_at", "complaints", ["assigned_at"])

    op.execute(
        """
        UPDATE complaints
        SET assigned_at = updated_at
        WHERE assigned_to_user_id IS NOT NULL AND assigned_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_complaints_assigned_at", table_name="complaints")
    op.drop_column("complaints", "assigned_at")
