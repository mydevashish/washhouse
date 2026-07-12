"""Platform configuration migration.

Revision ID: 20260603_0022
Revises: 20260603_0021
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0022"
down_revision = "20260603_0021"
branch_labels = None
depends_on = None

_DEFAULTS = (
    ("order_min_amount_inr", "99"),
    ("order_max_amount_inr", "50000"),
    ("pickup_radius_km", "5"),
    ("delivery_radius_km", "8"),
    ("dispute_window_hours", "48"),
    ("refund_window_hours", "48"),
    ("dispute_sla_hours", '{"low":72,"medium":48,"high":24,"critical":4}'),
    ("session_idle_timeout_minutes", "30"),
    ("session_warning_timeout_minutes", "5"),
    ("notify_email_enabled", "true"),
    ("notify_sms_enabled", "true"),
    ("notify_push_enabled", "true"),
    ("notify_in_app_enabled", "true"),
)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'platform_config_change'")

    op.create_table(
        "partner_commission_overrides",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("commission_rate", sa.Numeric(5, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    for key, value in _DEFAULTS:
        op.execute(
            sa.text(
                "INSERT INTO platform_settings (key, value, created_at, updated_at) "
                "VALUES (:key, :value, now(), now()) ON CONFLICT (key) DO NOTHING",
            ).bindparams(key=key, value=value),
        )


def downgrade() -> None:
    op.drop_table("partner_commission_overrides")
    for key, _ in _DEFAULTS:
        op.execute(sa.text("DELETE FROM platform_settings WHERE key = :key").bindparams(key=key))
