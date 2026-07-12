"""Dispute management — enum extensions, photos, status history.

Revision ID: 20260603_0011
Revises: 20260603_0010
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0011"
down_revision = "20260603_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend complaint_type enum
    for value in ("missing_item", "damaged_item", "wrong_item", "late_delivery", "quality_issue"):
        op.execute(f"ALTER TYPE complaint_type ADD VALUE IF NOT EXISTS '{value}'")

    # Rename in_review → investigating, add escalated
    op.execute("ALTER TYPE complaint_status RENAME VALUE 'in_review' TO 'investigating'")
    op.execute("ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'escalated'")

    op.create_table(
        "complaint_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "complaint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("complaints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("original_storage_key", sa.String(512), nullable=False),
        sa.Column("compressed_storage_key", sa.String(512), nullable=False),
        sa.Column(
            "uploaded_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("sort_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_complaint_photos_complaint_id", "complaint_photos", ["complaint_id"])

    custody_actor_role = postgresql.ENUM(name="custody_actor_role", create_type=False)

    op.create_table(
        "complaint_status_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "complaint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("complaints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(name="complaint_status", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("actor_role", custody_actor_role, nullable=False),
        sa.Column("note", sa.String(2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_complaint_status_events_complaint_id", "complaint_status_events", ["complaint_id"])

    # Backfill open status events for existing complaints
    op.execute(
        """
        INSERT INTO complaint_status_events (id, complaint_id, status, actor_user_id, actor_role, note, created_at)
        SELECT gen_random_uuid(), c.id, c.status, c.user_id, 'customer', 'Migrated dispute record', c.created_at
        FROM complaints c
        WHERE NOT EXISTS (
            SELECT 1 FROM complaint_status_events e WHERE e.complaint_id = c.id
        )
        """
    )


def downgrade() -> None:
    op.drop_index("ix_complaint_status_events_complaint_id", table_name="complaint_status_events")
    op.drop_table("complaint_status_events")
    op.drop_index("ix_complaint_photos_complaint_id", table_name="complaint_photos")
    op.drop_table("complaint_photos")
    op.execute("ALTER TYPE complaint_status RENAME VALUE 'investigating' TO 'in_review'")
