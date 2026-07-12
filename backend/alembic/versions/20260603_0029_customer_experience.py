"""Customer experience enhancement migration.

Revision ID: 20260603_0029
Revises: 20260603_0028
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0029"
down_revision = "20260603_0028"
branch_labels = None
depends_on = None

engagement_event_type = postgresql.ENUM(
    "store_view",
    "service_view",
    "call_click",
    "whatsapp_click",
    "callback_request",
    "question_asked",
    name="engagement_event_type",
    create_type=False,
)

question_status = postgresql.ENUM(
    "pending",
    "answered",
    "hidden",
    "removed",
    name="question_status",
    create_type=False,
)

callback_request_status = postgresql.ENUM(
    "pending",
    "contacted",
    "cancelled",
    name="callback_request_status",
    create_type=False,
)

DEFAULT_CATEGORIES = [
    ("wash", "Wash", "Standard washing services", 1),
    ("iron", "Iron", "Pressing and ironing", 2),
    ("wash-iron", "Wash + Iron", "Combined wash and iron", 3),
    ("dry-clean", "Dry Clean", "Dry cleaning for delicate garments", 4),
    ("premium-care", "Premium Care", "Specialty and premium garment care", 5),
    ("home-linen", "Home Linen", "Blankets, curtains, and home textiles", 6),
    ("specialty", "Specialty", "Carpet and other specialty cleaning", 7),
]

DEFAULT_FACILITIES = [
    ("steam-iron", "Steam Iron", 1),
    ("express-service", "Express Service", 2),
    ("premium-care", "Premium Care", 3),
    ("eco-friendly", "Eco Friendly", 4),
    ("commercial-machines", "Commercial Machines", 5),
    ("same-day-delivery", "Same Day Delivery", 6),
    ("24-hour-delivery", "24 Hour Delivery", 7),
    ("pickup-delivery", "Pickup & Delivery", 8),
]


def upgrade() -> None:
    engagement_event_type.create(op.get_bind(), checkfirst=True)
    question_status.create(op.get_bind(), checkfirst=True)
    callback_request_status.create(op.get_bind(), checkfirst=True)

    op.add_column("laundry_services", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("laundry_services", sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True))
    op.add_column("laundry_services", sa.Column("express_available", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("laundry_services", sa.Column("pickup_available", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("laundry_services", sa.Column("delivery_available", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("laundry_services", sa.Column("catalog_status", sa.String(20), nullable=False, server_default="active"))
    op.add_column("laundry_services", sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("laundry_services", sa.Column("order_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("laundry_services", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))

    op.add_column("laundry_storefronts", sa.Column("whatsapp_number", sa.String(20), nullable=True))
    op.add_column("laundry_storefronts", sa.Column("show_call", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("laundry_storefronts", sa.Column("show_whatsapp", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("laundry_storefronts", sa.Column("show_callback", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("laundry_storefronts", sa.Column("approval_status", sa.String(20), nullable=False, server_default="approved"))

    op.create_table(
        "service_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), unique=True, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(40), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "platform_facility_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), unique=True, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "storefront_engagement_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundry_services.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", engagement_event_type, nullable=False),
        sa.Column("source", sa.String(40), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_storefront_engagement_events_laundry_id", "storefront_engagement_events", ["laundry_id"])
    op.create_index("ix_storefront_engagement_events_event_type", "storefront_engagement_events", ["event_type"])
    op.create_index("ix_storefront_engagement_events_created_at", "storefront_engagement_events", ["created_at"])

    op.create_table(
        "customer_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("status", question_status, nullable=False, server_default="pending"),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("answered_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("moderated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_customer_questions_laundry_id", "customer_questions", ["laundry_id"])

    op.create_table(
        "callback_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("preferred_time", sa.String(120), nullable=True),
        sa.Column("status", callback_request_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_callback_requests_laundry_id", "callback_requests", ["laundry_id"])

    for slug, name, desc, order in DEFAULT_CATEGORIES:
        op.execute(
            sa.text(
                "INSERT INTO service_categories (id, slug, name, description, sort_order, is_active) "
                "VALUES (gen_random_uuid(), :slug, :name, :desc, :ord, true) "
                "ON CONFLICT (slug) DO NOTHING",
            ).bindparams(slug=slug, name=name, desc=desc, ord=order),
        )

    for slug, name, order in DEFAULT_FACILITIES:
        op.execute(
            sa.text(
                "INSERT INTO platform_facility_tags (id, slug, name, sort_order, is_active) "
                "VALUES (gen_random_uuid(), :slug, :name, :ord, true) "
                "ON CONFLICT (slug) DO NOTHING",
            ).bindparams(slug=slug, name=name, ord=order),
        )


def downgrade() -> None:
    op.drop_table("callback_requests")
    op.drop_table("customer_questions")
    op.drop_table("storefront_engagement_events")
    op.drop_table("platform_facility_tags")
    op.drop_table("service_categories")
    op.drop_column("laundry_storefronts", "approval_status")
    op.drop_column("laundry_storefronts", "show_callback")
    op.drop_column("laundry_storefronts", "show_whatsapp")
    op.drop_column("laundry_storefronts", "show_call")
    op.drop_column("laundry_storefronts", "whatsapp_number")
    op.drop_column("laundry_services", "sort_order")
    op.drop_column("laundry_services", "order_count")
    op.drop_column("laundry_services", "view_count")
    op.drop_column("laundry_services", "catalog_status")
    op.drop_column("laundry_services", "delivery_available")
    op.drop_column("laundry_services", "pickup_available")
    op.drop_column("laundry_services", "express_available")
    op.drop_column("laundry_services", "estimated_duration_minutes")
    op.drop_column("laundry_services", "description")
    op.execute("DROP TYPE IF EXISTS callback_request_status")
    op.execute("DROP TYPE IF EXISTS question_status")
    op.execute("DROP TYPE IF EXISTS engagement_event_type")
