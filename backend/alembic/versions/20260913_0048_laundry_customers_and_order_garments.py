"""Laundry customers, service-garment links, order garment lines.

Revision ID: 20260913_0048
Revises: 20260912_0047
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "20260913_0048"
down_revision = "20260912_0047"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    return name in inspect(op.get_bind()).get_table_names()


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    if table not in inspect(bind).get_table_names():
        return False
    return column in {col["name"] for col in inspect(bind).get_columns(table)}


def upgrade() -> None:
    op.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

    if not _has_table("laundry_customers"):
        op.create_table(
            "laundry_customers",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column(
                "laundry_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundries.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("full_name", sa.String(length=200), nullable=False),
            sa.Column("phone", sa.String(length=20), nullable=False),
            sa.Column("gender", sa.String(length=10), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column(
                "registered_by_user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_laundry_customers_laundry_id", "laundry_customers", ["laundry_id"])
        op.create_index("ix_laundry_customers_user_id", "laundry_customers", ["user_id"])
        op.create_index("ix_laundry_customers_phone", "laundry_customers", ["phone"])
        op.create_index(
            "uq_laundry_customers_laundry_phone_active",
            "laundry_customers",
            ["laundry_id", "phone"],
            unique=True,
            postgresql_where=sa.text("deleted_at IS NULL"),
        )

    if not _has_table("laundry_service_garments"):
        op.create_table(
            "laundry_service_garments",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column(
                "laundry_service_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundry_services.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "garment_item_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundry_garment_items.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.UniqueConstraint(
                "laundry_service_id",
                "garment_item_id",
                name="uq_laundry_service_garments_service_garment",
            ),
        )
        op.create_index("ix_laundry_service_garments_laundry_service_id", "laundry_service_garments", ["laundry_service_id"])
        op.create_index("ix_laundry_service_garments_garment_item_id", "laundry_service_garments", ["garment_item_id"])

    if not _has_table("order_item_garments"):
        op.create_table(
            "order_item_garments",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column(
                "order_item_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "garment_item_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundry_garment_items.id", ondelete="RESTRICT"),
                nullable=False,
            ),
            sa.Column("garment_name", sa.String(length=120), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.CheckConstraint("quantity >= 1", name="ck_order_item_garments_qty_positive"),
        )
        op.create_index("ix_order_item_garments_order_item_id", "order_item_garments", ["order_item_id"])
        op.create_index("ix_order_item_garments_garment_item_id", "order_item_garments", ["garment_item_id"])

    if not _has_column("orders", "laundry_customer_id"):
        op.add_column(
            "orders",
            sa.Column(
                "laundry_customer_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundry_customers.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
        op.create_index("ix_orders_laundry_customer_id", "orders", ["laundry_customer_id"])

    op.execute(
        text(
            """
            INSERT INTO laundry_customers (laundry_id, user_id, full_name, phone, created_at, updated_at)
            SELECT DISTINCT ON (o.laundry_id, o.customer_phone)
                o.laundry_id,
                o.user_id,
                COALESCE(NULLIF(BTRIM(o.customer_name), ''), 'Walk-in customer'),
                o.customer_phone,
                NOW(),
                NOW()
            FROM orders o
            WHERE o.customer_phone IS NOT NULL
              AND o.deleted_at IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM laundry_customers c
                WHERE c.laundry_id = o.laundry_id
                  AND c.phone = o.customer_phone
                  AND c.deleted_at IS NULL
              )
            ORDER BY o.laundry_id, o.customer_phone, o.created_at
            """
        ),
    )
    op.execute(
        text(
            """
            INSERT INTO laundry_customers (laundry_id, user_id, full_name, phone, gender, notes, registered_by_user_id, created_at, updated_at)
            SELECT r.laundry_id, r.user_id, COALESCE(NULLIF(BTRIM(u.full_name), ''), 'Customer'), u.phone,
                   r.gender, r.crm_notes, r.registered_by_user_id, r.created_at, r.updated_at
            FROM laundry_customer_registrations r
            JOIN users u ON u.id = r.user_id
            WHERE u.phone IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM laundry_customers c
                WHERE c.laundry_id = r.laundry_id
                  AND c.phone = u.phone
                  AND c.deleted_at IS NULL
              )
            """
        ),
    )
    op.execute(
        text(
            """
            UPDATE orders o
            SET laundry_customer_id = c.id
            FROM laundry_customers c
            WHERE o.laundry_customer_id IS NULL
              AND o.deleted_at IS NULL
              AND o.customer_phone IS NOT NULL
              AND c.laundry_id = o.laundry_id
              AND c.phone = o.customer_phone
              AND c.deleted_at IS NULL
            """
        ),
    )


def downgrade() -> None:
    if _has_column("orders", "laundry_customer_id"):
        op.drop_index("ix_orders_laundry_customer_id", table_name="orders")
        op.drop_column("orders", "laundry_customer_id")
    if _has_table("order_item_garments"):
        op.drop_table("order_item_garments")
    if _has_table("laundry_service_garments"):
        op.drop_table("laundry_service_garments")
    if _has_table("laundry_customers"):
        op.drop_table("laundry_customers")
