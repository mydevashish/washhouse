"""Delivery OTP verification.

Revision ID: 20260603_0008
Revises: 20260603_0007
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0008"
down_revision = "20260603_0007"
branch_labels = None
depends_on = None

delivery_otp_status = postgresql.ENUM(
    "active",
    "verified",
    "expired",
    "locked",
    name="delivery_otp_status",
    create_type=False,
)


def upgrade() -> None:
    delivery_otp_status.create(op.get_bind(), checkfirst=True)

    op.execute(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'delivery_otp_generated'",
    )
    op.execute(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'delivery_otp_verified'",
    )
    op.execute(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'delivery_otp_failed'",
    )
    op.execute(
        "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'delivery_otp_agent_locked'",
    )

    op.add_column(
        "users",
        sa.Column("delivery_otp_fail_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("delivery_otp_locked_until", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "order_delivery_otps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("code_hash", sa.String(255), nullable=False),
        sa.Column("code_ciphertext", sa.String(512), nullable=True),
        sa.Column("status", delivery_otp_status, nullable=False, server_default="active"),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("failed_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_agent_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verification_latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("verification_longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("order_id", name="uq_order_delivery_otps_order_id"),
    )
    op.create_index("ix_order_delivery_otps_order_id", "order_delivery_otps", ["order_id"])
    op.create_index("ix_order_delivery_otps_customer_id", "order_delivery_otps", ["customer_id"])


def downgrade() -> None:
    op.drop_index("ix_order_delivery_otps_customer_id", table_name="order_delivery_otps")
    op.drop_index("ix_order_delivery_otps_order_id", table_name="order_delivery_otps")
    op.drop_table("order_delivery_otps")
    op.drop_column("users", "delivery_otp_locked_until")
    op.drop_column("users", "delivery_otp_fail_count")
    delivery_otp_status.drop(op.get_bind(), checkfirst=True)
