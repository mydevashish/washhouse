"""Review management migration.

Revision ID: 20260603_0023
Revises: 20260603_0022
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0023"
down_revision = "20260603_0022"
branch_labels = None
depends_on = None

review_status = postgresql.ENUM(
    "published",
    "hidden",
    "removed",
    "pending_moderation",
    name="review_status",
    create_type=False,
)

_REVIEW_AUDIT_ACTIONS = (
    "review_reply",
    "review_abuse_report",
    "review_moderated",
    "review_removed",
    "review_restored",
)


def upgrade() -> None:
    review_status.create(op.get_bind(), checkfirst=True)

    with op.get_context().autocommit_block():
        for value in _REVIEW_AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")

    op.add_column(
        "reviews",
        sa.Column("status", review_status, nullable=False, server_default="published"),
    )
    op.add_column("reviews", sa.Column("partner_reply", sa.Text(), nullable=True))
    op.add_column("reviews", sa.Column("partner_replied_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reviews", sa.Column("partner_replied_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("reviews", sa.Column("abuse_reported", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("reviews", sa.Column("abuse_reason", sa.String(500), nullable=True))
    op.add_column("reviews", sa.Column("abuse_reported_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reviews", sa.Column("abuse_reported_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("reviews", sa.Column("is_fake", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("reviews", sa.Column("moderation_note", sa.String(500), nullable=True))
    op.add_column("reviews", sa.Column("moderated_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("reviews", sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key(
        "fk_reviews_partner_replied_by",
        "reviews",
        "users",
        ["partner_replied_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_reviews_abuse_reported_by",
        "reviews",
        "users",
        ["abuse_reported_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_reviews_moderated_by",
        "reviews",
        "users",
        ["moderated_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_reviews_status", "reviews", ["status"])
    op.create_index("ix_reviews_abuse_reported", "reviews", ["abuse_reported"])


def downgrade() -> None:
    op.drop_index("ix_reviews_abuse_reported", "reviews")
    op.drop_index("ix_reviews_status", "reviews")
    op.drop_constraint("fk_reviews_moderated_by", "reviews", type_="foreignkey")
    op.drop_constraint("fk_reviews_abuse_reported_by", "reviews", type_="foreignkey")
    op.drop_constraint("fk_reviews_partner_replied_by", "reviews", type_="foreignkey")
    for col in (
        "moderated_at",
        "moderated_by_user_id",
        "moderation_note",
        "is_fake",
        "abuse_reported_by_user_id",
        "abuse_reported_at",
        "abuse_reason",
        "abuse_reported",
        "partner_replied_by_user_id",
        "partner_replied_at",
        "partner_reply",
        "status",
    ):
        op.drop_column("reviews", col)
    review_status.drop(op.get_bind(), checkfirst=True)
