"""Chain-of-custody timeline — append-only order audit trail.

Revision ID: 20260603_0010
Revises: 20260603_0009
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0010"
down_revision = "20260603_0009"
branch_labels = None
depends_on = None

custody_event_type = postgresql.ENUM(
    "order_confirmed",
    "pickup_assigned",
    "pickup_photos_uploaded",
    "inventory_recorded",
    "inventory_confirmed",
    "pickup_completed",
    "washing_started",
    "ironing_started",
    "packaging_completed",
    "delivery_assigned",
    "delivery_proof_uploaded",
    "otp_verified",
    "delivered",
    "order_cancelled",
    name="custody_event_type",
    create_type=False,
)

custody_actor_role = postgresql.ENUM(
    "customer",
    "partner",
    "admin",
    "system",
    "delivery",
    name="custody_actor_role",
    create_type=False,
)


def upgrade() -> None:
    custody_event_type.create(op.get_bind(), checkfirst=True)
    custody_actor_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "order_custody_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", custody_event_type, nullable=False),
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("actor_role", custody_actor_role, nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_order_custody_events_order_id", "order_custody_events", ["order_id"])
    op.create_index("ix_order_custody_events_event_type", "order_custody_events", ["event_type"])
    op.create_index("ix_order_custody_events_actor_user_id", "order_custody_events", ["actor_user_id"])


def downgrade() -> None:
    op.drop_index("ix_order_custody_events_actor_user_id", table_name="order_custody_events")
    op.drop_index("ix_order_custody_events_event_type", table_name="order_custody_events")
    op.drop_index("ix_order_custody_events_order_id", table_name="order_custody_events")
    op.drop_table("order_custody_events")
    custody_actor_role.drop(op.get_bind(), checkfirst=True)
    custody_event_type.drop(op.get_bind(), checkfirst=True)
