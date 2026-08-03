"""Booking requests - Book Now / phone CRM inbox tables.

Revision ID: 20260803_0038
Revises: 20260730_0037
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260803_0038"
down_revision = "20260730_0037"
branch_labels = None
depends_on = None


def _create_enum_if_not_exists(name: str, values_sql: str) -> None:
    """Idempotent enum creation — safe when a prior migration attempt partially applied."""
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({values_sql});
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )


booking_request_service_type = postgresql.ENUM(
    "wash-fold",
    "wash-iron",
    "premium-laundry",
    "dry-clean",
    "shoe-cleaning",
    "curtain-cleaning",
    "other",
    name="booking_request_service_type",
    create_type=False,
)

booking_request_preferred_time = postgresql.ENUM(
    "morning",
    "afternoon",
    "evening",
    "flexible",
    name="booking_request_preferred_time",
    create_type=False,
)

booking_request_source = postgresql.ENUM(
    "marketing_home",
    "stores",
    "services",
    "deep_link",
    "admin_created",
    "partner_created",
    name="booking_request_source",
    create_type=False,
)

booking_request_status = postgresql.ENUM(
    "new",
    "reviewing",
    "assigned",
    "contacted",
    "confirmed",
    "converted_to_order",
    "declined",
    "expired",
    "cancelled",
    name="booking_request_status",
    create_type=False,
)

booking_request_priority = postgresql.ENUM(
    "normal",
    "high",
    "urgent",
    name="booking_request_priority",
    create_type=False,
)

booking_request_created_by_role = postgresql.ENUM(
    "public",
    "admin",
    "partner",
    name="booking_request_created_by_role",
    create_type=False,
)

booking_request_message_author_role = postgresql.ENUM(
    "admin",
    "partner",
    "system",
    name="booking_request_message_author_role",
    create_type=False,
)

booking_request_message_visibility = postgresql.ENUM(
    "customer_facing",
    "internal",
    name="booking_request_message_visibility",
    create_type=False,
)

booking_request_event_type = postgresql.ENUM(
    "created",
    "updated",
    "status_changed",
    "assigned",
    "transferred",
    "released",
    "responded",
    "note_added",
    "soft_deleted",
    "restored",
    "converted",
    "expired",
    name="booking_request_event_type",
    create_type=False,
)


def upgrade() -> None:
    _create_enum_if_not_exists(
        "booking_request_service_type",
        "'wash-fold', 'wash-iron', 'premium-laundry', 'dry-clean', "
        "'shoe-cleaning', 'curtain-cleaning', 'other'",
    )
    _create_enum_if_not_exists(
        "booking_request_preferred_time",
        "'morning', 'afternoon', 'evening', 'flexible'",
    )
    _create_enum_if_not_exists(
        "booking_request_source",
        "'marketing_home', 'stores', 'services', 'deep_link', "
        "'admin_created', 'partner_created'",
    )
    _create_enum_if_not_exists(
        "booking_request_status",
        "'new', 'reviewing', 'assigned', 'contacted', 'confirmed', "
        "'converted_to_order', 'declined', 'expired', 'cancelled'",
    )
    _create_enum_if_not_exists(
        "booking_request_priority",
        "'normal', 'high', 'urgent'",
    )
    _create_enum_if_not_exists(
        "booking_request_created_by_role",
        "'public', 'admin', 'partner'",
    )
    _create_enum_if_not_exists(
        "booking_request_message_author_role",
        "'admin', 'partner', 'system'",
    )
    _create_enum_if_not_exists(
        "booking_request_message_visibility",
        "'customer_facing', 'internal'",
    )
    _create_enum_if_not_exists(
        "booking_request_event_type",
        "'created', 'updated', 'status_changed', 'assigned', 'transferred', "
        "'released', 'responded', 'note_added', 'soft_deleted', 'restored', "
        "'converted', 'expired'",
    )

    op.create_table(
        "booking_requests",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("public_code", sa.String(16), nullable=False),
        sa.Column("customer_name", sa.String(100), nullable=False),
        sa.Column("phone_e164", sa.String(20), nullable=False),
        sa.Column("service_type", booking_request_service_type, nullable=False),
        sa.Column("preferred_time_window", booking_request_preferred_time, nullable=False),
        sa.Column("address_text", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("pincode", sa.String(10), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", booking_request_source, nullable=False),
        sa.Column("status", booking_request_status, nullable=False, server_default="new"),
        sa.Column("priority", booking_request_priority, nullable=False, server_default="normal"),
        sa.Column(
            "assigned_laundry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundries.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("assigned_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "assigned_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "converted_order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_by_role", booking_request_created_by_role, nullable=False),
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("client_ip", sa.String(45), nullable=True),
        sa.Column("last_response_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("closed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("public_code", name="uq_booking_requests_public_code"),
    )

    op.create_index("ix_booking_requests_phone_e164", "booking_requests", ["phone_e164"])
    op.create_index("ix_booking_requests_status", "booking_requests", ["status"])
    op.create_index(
        "ix_booking_requests_assigned_laundry_id",
        "booking_requests",
        ["assigned_laundry_id"],
    )
    op.create_index("ix_booking_requests_created_at", "booking_requests", ["created_at"])
    op.create_index(
        "ix_booking_requests_phone_e164_created_at",
        "booking_requests",
        ["phone_e164", "created_at"],
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_booking_requests_status_created_at
        ON booking_requests (status, created_at)
        WHERE deleted_at IS NULL
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_booking_requests_assigned_laundry_id_status
        ON booking_requests (assigned_laundry_id, status)
        WHERE deleted_at IS NULL
        """
    )

    op.create_table(
        "booking_request_messages",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "booking_request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("booking_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("author_role", booking_request_message_author_role, nullable=False),
        sa.Column("visibility", booking_request_message_visibility, nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(body) <= 4000",
            name="ck_booking_request_messages_body_len",
        ),
    )
    op.create_index(
        "ix_booking_request_messages_booking_request_id",
        "booking_request_messages",
        ["booking_request_id"],
    )
    op.create_index(
        "ix_booking_request_messages_request_id_created_at",
        "booking_request_messages",
        ["booking_request_id", "created_at"],
    )

    op.create_table(
        "booking_request_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "booking_request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("booking_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", booking_request_event_type, nullable=False),
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("from_status", booking_request_status, nullable=True),
        sa.Column("to_status", booking_request_status, nullable=True),
        sa.Column("from_laundry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("to_laundry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_booking_request_events_booking_request_id",
        "booking_request_events",
        ["booking_request_id"],
    )
    op.create_index(
        "ix_booking_request_events_request_id_created_at",
        "booking_request_events",
        ["booking_request_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_booking_request_events_request_id_created_at",
        table_name="booking_request_events",
    )
    op.drop_index(
        "ix_booking_request_events_booking_request_id",
        table_name="booking_request_events",
    )
    op.drop_table("booking_request_events")

    op.drop_index(
        "ix_booking_request_messages_request_id_created_at",
        table_name="booking_request_messages",
    )
    op.drop_index(
        "ix_booking_request_messages_booking_request_id",
        table_name="booking_request_messages",
    )
    op.drop_table("booking_request_messages")

    op.execute("DROP INDEX IF EXISTS ix_booking_requests_assigned_laundry_id_status")
    op.execute("DROP INDEX IF EXISTS ix_booking_requests_status_created_at")
    op.drop_index("ix_booking_requests_phone_e164_created_at", table_name="booking_requests")
    op.drop_index("ix_booking_requests_created_at", table_name="booking_requests")
    op.drop_index("ix_booking_requests_assigned_laundry_id", table_name="booking_requests")
    op.drop_index("ix_booking_requests_status", table_name="booking_requests")
    op.drop_index("ix_booking_requests_phone_e164", table_name="booking_requests")
    op.drop_table("booking_requests")

    for type_name in (
        "booking_request_event_type",
        "booking_request_message_visibility",
        "booking_request_message_author_role",
        "booking_request_created_by_role",
        "booking_request_priority",
        "booking_request_status",
        "booking_request_source",
        "booking_request_preferred_time",
        "booking_request_service_type",
    ):
        op.execute(f"DROP TYPE IF EXISTS {type_name}")
