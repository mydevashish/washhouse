"""Dispute datatable — priority, assignment, extended statuses, internal notes.

Revision ID: 20260603_0015
Revises: 20260603_0014
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0015"
down_revision = "20260603_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE dispute_priority AS ENUM ('low', 'medium', 'high', 'critical')")

    # PG requires enum value additions committed before use in same migration
    with op.get_context().autocommit_block():
        for value in ("awaiting_customer", "awaiting_partner", "closed"):
            op.execute(f"ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS '{value}'")
        for value in ("payment_issue", "other"):
            op.execute(f"ALTER TYPE complaint_type ADD VALUE IF NOT EXISTS '{value}'")

    dispute_priority = postgresql.ENUM(
        "low", "medium", "high", "critical", name="dispute_priority", create_type=False
    )

    op.add_column(
        "complaints",
        sa.Column("priority", dispute_priority, nullable=False, server_default="medium"),
    )
    op.add_column(
        "complaints",
        sa.Column(
            "assigned_to_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "complaints",
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_complaints_priority", "complaints", ["priority"])
    op.create_index("ix_complaints_assigned_to_user_id", "complaints", ["assigned_to_user_id"])
    op.create_index("ix_complaints_status", "complaints", ["status"])

    op.execute(
        """
        UPDATE complaints SET priority = 'high'
        WHERE complaint_type = 'refund_request' OR status = 'escalated'
        """
    )
    op.execute(
        """
        UPDATE complaints SET priority = 'critical'
        WHERE status = 'escalated'
        """
    )
    op.execute(
        """
        UPDATE complaints SET resolved_at = updated_at
        WHERE status IN ('resolved', 'rejected', 'closed')
        """
    )

    op.create_table(
        "complaint_internal_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "complaint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("complaints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_edited", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_complaint_internal_notes_complaint_id", "complaint_internal_notes", ["complaint_id"])


def downgrade() -> None:
    op.drop_index("ix_complaint_internal_notes_complaint_id", table_name="complaint_internal_notes")
    op.drop_table("complaint_internal_notes")
    op.drop_index("ix_complaints_status", table_name="complaints")
    op.drop_index("ix_complaints_assigned_to_user_id", table_name="complaints")
    op.drop_index("ix_complaints_priority", table_name="complaints")
    op.drop_column("complaints", "resolved_at")
    op.drop_column("complaints", "assigned_to_user_id")
    op.drop_column("complaints", "priority")
    op.execute("DROP TYPE dispute_priority")
