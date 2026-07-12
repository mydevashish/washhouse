"""Announcement center migration.

Revision ID: 20260603_0026
Revises: 20260603_0025
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0026"
down_revision = "20260603_0025"
branch_labels = None
depends_on = None

announcement_status = postgresql.ENUM(
    "draft",
    "scheduled",
    "published",
    "archived",
    name="announcement_status",
    create_type=False,
)

announcement_target = postgresql.ENUM(
    "all_users",
    "customers",
    "partners",
    "specific_laundries",
    "specific_cities",
    name="announcement_target",
    create_type=False,
)

announcement_event_type = postgresql.ENUM(
    "view",
    "click",
    "acknowledge",
    name="announcement_event_type",
    create_type=False,
)

_AUDIT_ACTIONS = (
    "announcement_created",
    "announcement_updated",
    "announcement_scheduled",
    "announcement_published",
    "announcement_archived",
)


def upgrade() -> None:
    announcement_status.create(op.get_bind(), checkfirst=True)
    announcement_target.create(op.get_bind(), checkfirst=True)
    announcement_event_type.create(op.get_bind(), checkfirst=True)

    with op.get_context().autocommit_block():
        for value in _AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")

    op.create_table(
        "announcements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", announcement_status, nullable=False, server_default="draft"),
        sa.Column("target_type", announcement_target, nullable=False),
        sa.Column(
            "target_laundry_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "target_cities",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("channel_in_app", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("channel_email", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("channel_push", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("action_url", sa.String(500), nullable=True),
        sa.Column("requires_acknowledgement", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("acknowledgement_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_announcements_status", "announcements", ["status"])

    op.create_table(
        "announcement_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("announcement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", announcement_event_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_announcement_events_announcement_id", "announcement_events", ["announcement_id"])
    op.create_index("ix_announcement_events_user_id", "announcement_events", ["user_id"])
    op.create_index(
        "uq_announcement_events_view_ack",
        "announcement_events",
        ["announcement_id", "user_id", "event_type"],
        unique=True,
        postgresql_where=sa.text("event_type IN ('view', 'acknowledge')"),
    )


def downgrade() -> None:
    op.drop_index("uq_announcement_events_view_ack", table_name="announcement_events")
    op.drop_table("announcement_events")
    op.drop_index("ix_announcements_status", table_name="announcements")
    op.drop_table("announcements")
    announcement_event_type.drop(op.get_bind(), checkfirst=True)
    announcement_target.drop(op.get_bind(), checkfirst=True)
    announcement_status.drop(op.get_bind(), checkfirst=True)
