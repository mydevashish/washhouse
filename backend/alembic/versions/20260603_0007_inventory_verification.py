"""Item inventory verification tables.

Revision ID: 20260603_0007
Revises: 20260603_0006
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0007"
down_revision = "20260603_0006"
branch_labels = None
depends_on = None

inventory_item_type = postgresql.ENUM(
    "shirts",
    "trousers",
    "sarees",
    "jackets",
    "bedsheets",
    "blankets",
    "curtains",
    "other",
    name="inventory_item_type",
    create_type=False,
)
inventory_verification_status = postgresql.ENUM(
    "pending_customer",
    "locked",
    "change_pending",
    name="inventory_verification_status",
    create_type=False,
)
inventory_history_action = postgresql.ENUM(
    "partner_recorded",
    "customer_confirmed",
    "locked",
    "change_requested",
    "admin_approved",
    "admin_rejected",
    name="inventory_history_action",
    create_type=False,
)
inventory_change_request_status = postgresql.ENUM(
    "pending",
    "approved",
    "rejected",
    name="inventory_change_request_status",
    create_type=False,
)


def upgrade() -> None:
    inventory_item_type.create(op.get_bind(), checkfirst=True)
    inventory_verification_status.create(op.get_bind(), checkfirst=True)
    inventory_history_action.create(op.get_bind(), checkfirst=True)
    inventory_change_request_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "order_inventory_verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", inventory_verification_status, nullable=False, server_default="pending_customer"),
        sa.Column("recorded_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("order_id", name="uq_order_inventory_verifications_order_id"),
    )
    op.create_index("ix_order_inventory_verifications_order_id", "order_inventory_verifications", ["order_id"])
    op.create_index("ix_order_inventory_verifications_customer_id", "order_inventory_verifications", ["customer_id"])
    op.create_index("ix_order_inventory_verifications_laundry_id", "order_inventory_verifications", ["laundry_id"])

    op.create_table(
        "order_inventory_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "verification_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("order_inventory_verifications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("item_type", inventory_item_type, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("verification_id", "item_type", name="uq_inventory_item_type"),
    )
    op.create_index("ix_order_inventory_items_verification_id", "order_inventory_items", ["verification_id"])

    op.create_table(
        "order_inventory_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "verification_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("order_inventory_verifications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("action", inventory_history_action, nullable=False),
        sa.Column("items_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_order_inventory_history_order_id", "order_inventory_history", ["order_id"])
    op.create_index("ix_order_inventory_history_verification_id", "order_inventory_history", ["verification_id"])

    op.create_table(
        "order_inventory_change_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "verification_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("order_inventory_verifications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("requested_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("proposed_items", postgresql.JSONB(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", inventory_change_request_status, nullable=False, server_default="pending"),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_order_inventory_change_requests_order_id", "order_inventory_change_requests", ["order_id"])
    op.create_index("ix_order_inventory_change_requests_verification_id", "order_inventory_change_requests", ["verification_id"])


def downgrade() -> None:
    op.drop_index("ix_order_inventory_change_requests_verification_id", table_name="order_inventory_change_requests")
    op.drop_index("ix_order_inventory_change_requests_order_id", table_name="order_inventory_change_requests")
    op.drop_table("order_inventory_change_requests")
    op.drop_index("ix_order_inventory_history_verification_id", table_name="order_inventory_history")
    op.drop_index("ix_order_inventory_history_order_id", table_name="order_inventory_history")
    op.drop_table("order_inventory_history")
    op.drop_index("ix_order_inventory_items_verification_id", table_name="order_inventory_items")
    op.drop_table("order_inventory_items")
    op.drop_index("ix_order_inventory_verifications_laundry_id", table_name="order_inventory_verifications")
    op.drop_index("ix_order_inventory_verifications_customer_id", table_name="order_inventory_verifications")
    op.drop_index("ix_order_inventory_verifications_order_id", table_name="order_inventory_verifications")
    op.drop_table("order_inventory_verifications")

    inventory_change_request_status.drop(op.get_bind(), checkfirst=True)
    inventory_history_action.drop(op.get_bind(), checkfirst=True)
    inventory_verification_status.drop(op.get_bind(), checkfirst=True)
    inventory_item_type.drop(op.get_bind(), checkfirst=True)
