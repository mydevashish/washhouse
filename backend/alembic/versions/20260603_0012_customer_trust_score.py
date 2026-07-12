"""Customer trust score — score column and event ledger.

Revision ID: 20260603_0012
Revises: 20260603_0011
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0012"
down_revision = "20260603_0011"
branch_labels = None
depends_on = None

trust_score_event_type = postgresql.ENUM(
    "refund_request",
    "dispute_filed",
    "chargeback",
    "failed_payment",
    "fake_claim",
    "successful_order",
    "positive_review",
    "long_history",
    name="trust_score_event_type",
    create_type=False,
)


def upgrade() -> None:
    trust_score_event_type.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="100"),
    )
    op.execute("UPDATE users SET trust_score = 100 WHERE trust_score IS NULL")

    op.create_table(
        "customer_trust_score_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", trust_score_event_type, nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("score_before", sa.Integer(), nullable=False),
        sa.Column("score_after", sa.Integer(), nullable=False),
        sa.Column("reference_type", sa.String(40), nullable=True),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_customer_trust_score_events_user_id", "customer_trust_score_events", ["user_id"])
    op.create_index("ix_customer_trust_score_events_event_type", "customer_trust_score_events", ["event_type"])
    op.create_index(
        "ix_trust_score_user_event_ref",
        "customer_trust_score_events",
        ["user_id", "event_type", "reference_id"],
        unique=True,
        postgresql_where=sa.text("reference_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_trust_score_user_event_ref", table_name="customer_trust_score_events")
    op.drop_index("ix_customer_trust_score_events_event_type", table_name="customer_trust_score_events")
    op.drop_index("ix_customer_trust_score_events_user_id", table_name="customer_trust_score_events")
    op.drop_table("customer_trust_score_events")
    op.drop_column("users", "trust_score")
    trust_score_event_type.drop(op.get_bind(), checkfirst=True)
