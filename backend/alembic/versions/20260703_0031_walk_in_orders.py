"""Walk-in order support for offline partner entry.

Revision ID: 20260703_0031
Revises: 20260603_0030
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260703_0031"
down_revision = "20260603_0030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE order_source AS ENUM ('online', 'walk_in')")
    order_source = postgresql.ENUM(name="order_source", create_type=False)

    op.alter_column("orders", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    op.alter_column("orders", "address_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)

    op.add_column(
        "orders",
        sa.Column(
            "order_source",
            order_source,
            nullable=False,
            server_default="online",
        ),
    )
    op.add_column("orders", sa.Column("customer_name", sa.String(200), nullable=True))
    op.add_column("orders", sa.Column("customer_phone", sa.String(20), nullable=True))
    op.add_column("orders", sa.Column("partner_notes", sa.Text(), nullable=True))

    op.create_index("ix_orders_order_source", "orders", ["order_source"])
    op.create_index("ix_orders_customer_phone", "orders", ["customer_phone"])


def downgrade() -> None:
    op.drop_index("ix_orders_customer_phone", table_name="orders")
    op.drop_index("ix_orders_order_source", table_name="orders")
    op.drop_column("orders", "partner_notes")
    op.drop_column("orders", "customer_phone")
    op.drop_column("orders", "customer_name")
    op.drop_column("orders", "order_source")

    op.alter_column("orders", "address_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.alter_column("orders", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)

    op.execute("DROP TYPE order_source")
