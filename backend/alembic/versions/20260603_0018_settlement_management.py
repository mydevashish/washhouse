"""Settlement & payout management tables.

Revision ID: 20260603_0018
Revises: 20260603_0017
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0018"
down_revision = "20260603_0017"
branch_labels = None
depends_on = None

settlement_status = postgresql.ENUM(
    "pending",
    "approved",
    "processing",
    "paid",
    "failed",
    "cancelled",
    name="settlement_status",
    create_type=False,
)

settlement_eligibility = postgresql.ENUM(
    "pending_window",
    "eligible",
    "in_settlement",
    "settled",
    "held_dispute",
    name="settlement_eligibility",
    create_type=False,
)


def upgrade() -> None:
    settlement_status.create(op.get_bind(), checkfirst=True)
    settlement_eligibility.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "settlements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("settlement_code", sa.String(32), nullable=False),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("partner_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("orders_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gross_revenue_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("commission_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("refund_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("adjustment_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("net_amount_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("status", settlement_status, nullable=False, server_default="pending"),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payout_reference", sa.String(120), nullable=True),
        sa.Column("failed_reason", sa.Text(), nullable=True),
        sa.Column("cancelled_reason", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_settlements_settlement_code", "settlements", ["settlement_code"], unique=True)
    op.create_index("ix_settlements_laundry_id", "settlements", ["laundry_id"])
    op.create_index("ix_settlements_partner_user_id", "settlements", ["partner_user_id"])
    op.create_index("ix_settlements_status", "settlements", ["status"])

    op.create_table(
        "settlement_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("settlement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("settlements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("gross_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("commission_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("refund_inr", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("net_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("order_id", name="uq_settlement_orders_order_id"),
    )
    op.create_index("ix_settlement_orders_settlement_id", "settlement_orders", ["settlement_id"])
    op.create_index("ix_settlement_orders_order_id", "settlement_orders", ["order_id"])

    op.create_table(
        "settlement_adjustments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("settlement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("settlements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_settlement_adjustments_settlement_id", "settlement_adjustments", ["settlement_id"])

    op.add_column("orders", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("settlement_eligible_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "orders",
        sa.Column(
            "settlement_eligibility",
            settlement_eligibility,
            nullable=False,
            server_default="pending_window",
        ),
    )
    op.add_column(
        "orders",
        sa.Column("settlement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("settlements.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_orders_delivered_at", "orders", ["delivered_at"])
    op.create_index("ix_orders_settlement_eligible_at", "orders", ["settlement_eligible_at"])
    op.create_index("ix_orders_settlement_eligibility", "orders", ["settlement_eligibility"])
    op.create_index("ix_orders_settlement_id", "orders", ["settlement_id"])

    # Backfill delivered_at from status events for existing delivered orders
    op.execute(
        """
        UPDATE orders o
        SET delivered_at = (
            SELECT MIN(e.created_at)
            FROM order_status_events e
            WHERE e.order_id = o.id AND e.status = 'delivered'
        )
        WHERE o.status = 'delivered' AND o.delivered_at IS NULL
        """
    )
    op.execute(
        """
        UPDATE orders
        SET settlement_eligible_at = delivered_at + INTERVAL '48 hours',
            settlement_eligibility = 'eligible'
        WHERE status = 'delivered'
          AND delivered_at IS NOT NULL
          AND delivered_at + INTERVAL '48 hours' <= NOW()
          AND settlement_id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_orders_settlement_id", table_name="orders")
    op.drop_index("ix_orders_settlement_eligibility", table_name="orders")
    op.drop_index("ix_orders_settlement_eligible_at", table_name="orders")
    op.drop_index("ix_orders_delivered_at", table_name="orders")
    op.drop_column("orders", "settlement_id")
    op.drop_column("orders", "settlement_eligibility")
    op.drop_column("orders", "settlement_eligible_at")
    op.drop_column("orders", "delivered_at")

    op.drop_index("ix_settlement_adjustments_settlement_id", table_name="settlement_adjustments")
    op.drop_table("settlement_adjustments")
    op.drop_index("ix_settlement_orders_order_id", table_name="settlement_orders")
    op.drop_index("ix_settlement_orders_settlement_id", table_name="settlement_orders")
    op.drop_table("settlement_orders")

    op.drop_index("ix_settlements_status", table_name="settlements")
    op.drop_index("ix_settlements_partner_user_id", table_name="settlements")
    op.drop_index("ix_settlements_laundry_id", table_name="settlements")
    op.drop_index("ix_settlements_settlement_code", table_name="settlements")
    op.drop_table("settlements")

    settlement_eligibility.drop(op.get_bind(), checkfirst=True)
    settlement_status.drop(op.get_bind(), checkfirst=True)
