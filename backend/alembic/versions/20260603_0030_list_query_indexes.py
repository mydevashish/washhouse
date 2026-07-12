"""List query performance indexes.

Revision ID: 20260603_0030
Revises: 20260603_0029
"""

from __future__ import annotations

from alembic import op

revision = "20260603_0030"
down_revision = "20260603_0029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_users_role_trust_score_created_at",
        "users",
        ["role", "trust_score", "created_at"],
    )
    op.create_index("ix_users_fraud_risk_level", "users", ["fraud_risk_level"])
    op.create_index("ix_orders_status_created_at", "orders", ["status", "created_at"])
    op.create_index("ix_complaints_user_id_type", "complaints", ["user_id", "complaint_type"])
    op.create_index("ix_audit_logs_resource_created_at", "audit_logs", ["resource_type", "created_at"])
    op.create_index("ix_audit_logs_action_created_at", "audit_logs", ["action", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_action_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_resource_created_at", table_name="audit_logs")
    op.drop_index("ix_complaints_user_id_type", table_name="complaints")
    op.drop_index("ix_orders_status_created_at", table_name="orders")
    op.drop_index("ix_users_fraud_risk_level", table_name="users")
    op.drop_index("ix_users_role_trust_score_created_at", table_name="users")
