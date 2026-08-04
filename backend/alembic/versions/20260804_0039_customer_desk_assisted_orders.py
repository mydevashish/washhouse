"""Customer Desk Slice 1–2 — assisted order_source + audit/address + idempotency + desk indexes.

Revision ID: 20260804_0039
Revises: 20260803_0038
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260804_0039"
down_revision = "20260803_0038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'assisted_admin'")
        op.execute("ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'assisted_partner'")

    op.add_column(
        "orders",
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("orders", sa.Column("address_line1", sa.String(255), nullable=True))
    op.add_column("orders", sa.Column("address_line2", sa.String(255), nullable=True))
    op.add_column("orders", sa.Column("address_city", sa.String(100), nullable=True))
    op.add_column("orders", sa.Column("address_pincode", sa.String(10), nullable=True))
    op.add_column("orders", sa.Column("address_landmark", sa.String(200), nullable=True))

    op.add_column(
        "orders",
        sa.Column("idempotency_key", sa.String(128), nullable=True),
    )
    op.create_index("ix_orders_created_by_user_id", "orders", ["created_by_user_id"])
    op.create_index(
        "uq_orders_idempotency_key",
        "orders",
        ["idempotency_key"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_orders_customer_phone_created_at "
        "ON orders (customer_phone, created_at DESC)",
    )
    # Partner desk: filter laundry_id first, then phone — composite for scoped history.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_orders_laundry_id_customer_phone "
        "ON orders (laundry_id, customer_phone, created_at DESC)",
    )


def downgrade() -> None:
    op.drop_index("ix_orders_laundry_id_customer_phone", table_name="orders")
    op.drop_index("ix_orders_customer_phone_created_at", table_name="orders")
    op.drop_index("uq_orders_idempotency_key", table_name="orders")
    op.drop_index("ix_orders_created_by_user_id", table_name="orders")
    op.drop_column("orders", "idempotency_key")
    op.drop_column("orders", "address_landmark")
    op.drop_column("orders", "address_pincode")
    op.drop_column("orders", "address_city")
    op.drop_column("orders", "address_line2")
    op.drop_column("orders", "address_line1")
    op.drop_column("orders", "created_by_user_id")
    # Postgres cannot drop enum values safely; leave assisted_* in place.
