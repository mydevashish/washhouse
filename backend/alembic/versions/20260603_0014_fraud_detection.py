"""Fraud detection — alerts, risk levels, and subject flags.

Revision ID: 20260603_0014
Revises: 20260603_0013
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0014"
down_revision = "20260603_0013"
branch_labels = None
depends_on = None

fraud_risk_level = postgresql.ENUM(
    "low",
    "medium",
    "high",
    "critical",
    name="fraud_risk_level",
    create_type=False,
)
fraud_subject_type = postgresql.ENUM(
    "customer",
    "partner",
    name="fraud_subject_type",
    create_type=False,
)
fraud_signal_type = postgresql.ENUM(
    "customer_dispute_spike",
    "customer_refund_rate",
    "customer_payment_failures",
    "customer_cancellations",
    "partner_excessive_complaints",
    "partner_inventory_mismatch",
    "partner_delivery_fraud",
    name="fraud_signal_type",
    create_type=False,
)
fraud_alert_status = postgresql.ENUM(
    "open",
    "acknowledged",
    "resolved",
    name="fraud_alert_status",
    create_type=False,
)


def upgrade() -> None:
    fraud_risk_level.create(op.get_bind(), checkfirst=True)
    fraud_subject_type.create(op.get_bind(), checkfirst=True)
    fraud_signal_type.create(op.get_bind(), checkfirst=True)
    fraud_alert_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column("fraud_risk_level", fraud_risk_level, nullable=False, server_default="low"),
    )
    op.add_column(
        "laundries",
        sa.Column("fraud_risk_level", fraud_risk_level, nullable=False, server_default="low"),
    )

    op.create_table(
        "fraud_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("subject_type", fraud_subject_type, nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("signal_type", fraud_signal_type, nullable=False),
        sa.Column("risk_level", fraud_risk_level, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", fraud_alert_status, nullable=False, server_default="open"),
        sa.Column("reference_type", sa.String(40), nullable=True),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("acknowledged_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_fraud_alerts_subject", "fraud_alerts", ["subject_type", "subject_id"])
    op.create_index("ix_fraud_alerts_status", "fraud_alerts", ["status"])
    op.create_index("ix_fraud_alerts_risk_level", "fraud_alerts", ["risk_level"])
    op.create_index("ix_fraud_alerts_signal_type", "fraud_alerts", ["signal_type"])
    op.create_index("ix_fraud_alerts_created_at", "fraud_alerts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_fraud_alerts_created_at", table_name="fraud_alerts")
    op.drop_index("ix_fraud_alerts_signal_type", table_name="fraud_alerts")
    op.drop_index("ix_fraud_alerts_risk_level", table_name="fraud_alerts")
    op.drop_index("ix_fraud_alerts_status", table_name="fraud_alerts")
    op.drop_index("ix_fraud_alerts_subject", table_name="fraud_alerts")
    op.drop_table("fraud_alerts")
    op.drop_column("laundries", "fraud_risk_level")
    op.drop_column("users", "fraud_risk_level")
    fraud_alert_status.drop(op.get_bind(), checkfirst=True)
    fraud_signal_type.drop(op.get_bind(), checkfirst=True)
    fraud_subject_type.drop(op.get_bind(), checkfirst=True)
    fraud_risk_level.drop(op.get_bind(), checkfirst=True)
