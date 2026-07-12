"""Profit sharing engine migration.

Revision ID: 20260603_0028
Revises: 20260603_0027
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0028"
down_revision = "20260603_0027"
branch_labels = None
depends_on = None

platform_expense_category = postgresql.ENUM(
    "operations",
    "marketing",
    "technology",
    "personnel",
    "other",
    name="platform_expense_category",
    create_type=False,
)

profit_share_period_status = postgresql.ENUM(
    "draft",
    "finalized",
    name="profit_share_period_status",
    create_type=False,
)

profit_share_payout_status = postgresql.ENUM(
    "pending",
    "paid",
    name="profit_share_payout_status",
    create_type=False,
)

_AUDIT_ACTIONS = (
    "ownership_partner_created",
    "ownership_partner_updated",
    "ownership_partner_deactivated",
    "platform_expense_recorded",
    "platform_expense_deleted",
    "profit_share_finalized",
    "profit_share_payout_released",
)


def upgrade() -> None:
    platform_expense_category.create(op.get_bind(), checkfirst=True)
    profit_share_period_status.create(op.get_bind(), checkfirst=True)
    profit_share_payout_status.create(op.get_bind(), checkfirst=True)

    with op.get_context().autocommit_block():
        for value in _AUDIT_ACTIONS:
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'")

    op.create_table(
        "platform_ownership_partners",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("ownership_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_platform_ownership_partners_user_id", "platform_ownership_partners", ["user_id"])

    op.create_table(
        "platform_expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("period_year", sa.Integer(), nullable=False),
        sa.Column("period_month", sa.Integer(), nullable=False),
        sa.Column("category", platform_expense_category, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("amount_inr", sa.Numeric(14, 2), nullable=False),
        sa.Column("recorded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_platform_expenses_period_year", "platform_expenses", ["period_year"])
    op.create_index("ix_platform_expenses_period_month", "platform_expenses", ["period_month"])

    op.create_table(
        "profit_share_periods",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("period_year", sa.Integer(), nullable=False),
        sa.Column("period_month", sa.Integer(), nullable=False),
        sa.Column("revenue_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("expenses_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("profit_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("status", profit_share_period_status, nullable=False, server_default="draft"),
        sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finalized_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("period_year", "period_month", name="uq_profit_share_periods_year_month"),
    )

    op.create_table(
        "profit_share_allocations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("period_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("profit_share_periods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("partner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("platform_ownership_partners.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("partner_name", sa.String(120), nullable=False),
        sa.Column("ownership_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("earnings_inr", sa.Numeric(14, 2), nullable=False),
        sa.Column("payout_status", profit_share_payout_status, nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_reference", sa.String(128), nullable=True),
        sa.Column("paid_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("period_id", "partner_id", name="uq_profit_share_allocations_period_partner"),
    )
    op.create_index("ix_profit_share_allocations_period_id", "profit_share_allocations", ["period_id"])
    op.create_index("ix_profit_share_allocations_partner_id", "profit_share_allocations", ["partner_id"])


def downgrade() -> None:
    op.drop_table("profit_share_allocations")
    op.drop_table("profit_share_periods")
    op.drop_table("platform_expenses")
    op.drop_table("platform_ownership_partners")
    op.execute("DROP TYPE IF EXISTS profit_share_payout_status")
    op.execute("DROP TYPE IF EXISTS profit_share_period_status")
    op.execute("DROP TYPE IF EXISTS platform_expense_category")
