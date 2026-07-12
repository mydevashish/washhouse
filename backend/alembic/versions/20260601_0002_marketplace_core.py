"""Marketplace core tables.

Revision ID: 20260601_0002
Revises: 20260529_0001
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260601_0002"
down_revision = "20260529_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE otp_purpose ADD VALUE IF NOT EXISTS 'password_reset'")

    op.execute(
        "CREATE TYPE laundry_status AS ENUM "
        "('pending_approval', 'approved', 'rejected', 'suspended')"
    )
    op.execute(
        "CREATE TYPE order_status AS ENUM ("
        "'confirmed', 'pickup_assigned', 'picked_up', 'washing', 'ironing', "
        "'ready', 'out_for_delivery', 'delivered', 'cancelled')"
    )
    op.execute(
        "CREATE TYPE payment_status AS ENUM "
        "('pending', 'pending_cod', 'paid', 'failed', 'refunded')"
    )
    op.execute("CREATE TYPE payment_method AS ENUM ('razorpay', 'cod')")
    op.execute(
        "CREATE TYPE subscription_status AS ENUM "
        "('active', 'past_due', 'cancelled', 'expired')"
    )
    op.execute(
        "CREATE TYPE complaint_status AS ENUM ('open', 'in_review', 'resolved', 'rejected')"
    )
    op.execute(
        "CREATE TYPE complaint_type AS ENUM ("
        "'missing_items', 'damaged_items', 'delayed_delivery', 'refund_request')"
    )
    op.execute(
        "CREATE TYPE partner_staff_role AS ENUM "
        "('pickup_only', 'delivery_only', 'inventory', 'full_access')"
    )

    laundry_status = postgresql.ENUM(name="laundry_status", create_type=False)
    order_status = postgresql.ENUM(name="order_status", create_type=False)
    payment_status = postgresql.ENUM(name="payment_status", create_type=False)
    payment_method = postgresql.ENUM(name="payment_method", create_type=False)
    subscription_status = postgresql.ENUM(name="subscription_status", create_type=False)
    complaint_status = postgresql.ENUM(name="complaint_status", create_type=False)
    complaint_type = postgresql.ENUM(name="complaint_type", create_type=False)
    partner_staff_role = postgresql.ENUM(name="partner_staff_role", create_type=False)

    op.create_table(
        "laundries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(220), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("address_line", sa.String(500), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("status", laundry_status, nullable=False, server_default="pending_approval"),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("commission_rate", sa.Numeric(5, 2), nullable=True),
        sa.Column("avg_rating", sa.Numeric(3, 2), server_default="0", nullable=False),
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("image_urls", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_laundries_city", "laundries", ["city"])
    op.create_index("ix_laundries_owner_user_id", "laundries", ["owner_user_id"])

    op.create_table(
        "laundry_services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("unit", sa.String(40), server_default="piece", nullable=False),
        sa.Column("price_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("address_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_addresses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="confirmed"),
        sa.Column("tracking_code", sa.String(32), nullable=False, unique=True),
        sa.Column("pickup_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("delivery_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("subtotal_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("delivery_fee_inr", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("gst_rate", sa.Numeric(5, 2), server_default="18", nullable=False),
        sa.Column("cgst_inr", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("sgst_inr", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("total_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="INR", nullable=False),
        sa.Column("invoice_number", sa.String(40), nullable=True, unique=True),
        sa.Column("commission_rate", sa.Numeric(5, 2), server_default="10", nullable=False),
        sa.Column("payment_status", payment_status, nullable=False, server_default="pending"),
        sa.Column("payment_method", payment_method, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_laundry_id", "orders", ["laundry_id"])

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundry_services.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("service_name", sa.String(120), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("line_total_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "order_status_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", order_status, nullable=False),
        sa.Column("note", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "order_inventory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("expected_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("received_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("missing_notes", sa.Text(), nullable=True),
        sa.Column("damaged_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "partner_staff",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("role", partner_staff_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "complaints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("complaint_type", complaint_type, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", complaint_status, server_default="open", nullable=False),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("amount_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", payment_status, nullable=False),
        sa.Column("method", payment_method, nullable=False),
        sa.Column("razorpay_order_id", sa.String(100), nullable=True),
        sa.Column("razorpay_payment_id", sa.String(100), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "subscription_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("price_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("interval_months", sa.Integer(), server_default="1", nullable=False),
        sa.Column("discount_percent", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", subscription_status, server_default="active", nullable=False),
        sa.Column("razorpay_subscription_id", sa.String(100), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(80), primary_key=True),
        sa.Column("value", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "loyalty_accounts",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("points_balance", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "referral_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "coupons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("discount_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.execute(
        "INSERT INTO platform_settings (key, value) VALUES ('default_commission_rate', '10') "
        "ON CONFLICT (key) DO NOTHING"
    )


def downgrade() -> None:
    for table in (
        "notifications",
        "coupons",
        "referral_codes",
        "loyalty_accounts",
        "platform_settings",
        "subscriptions",
        "subscription_plans",
        "payments",
        "complaints",
        "partner_staff",
        "reviews",
        "order_inventory",
        "order_status_events",
        "order_items",
        "orders",
        "laundry_services",
        "laundries",
    ):
        op.drop_table(table)
    for enum in (
        "partner_staff_role",
        "complaint_type",
        "complaint_status",
        "subscription_status",
        "payment_method",
        "payment_status",
        "order_status",
        "laundry_status",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum}")
