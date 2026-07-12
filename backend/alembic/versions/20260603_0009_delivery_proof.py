"""Delivery proof photo — immutable single record per order.

Revision ID: 20260603_0009
Revises: 20260603_0008
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0009"
down_revision = "20260603_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "delivery_proof_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "laundry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laundries.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("original_storage_key", sa.String(512), nullable=False),
        sa.Column("compressed_storage_key", sa.String(512), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column(
            "uploaded_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("device_info", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_delivery_proof_photos_order_id", "delivery_proof_photos", ["order_id"])
    op.create_index("ix_delivery_proof_photos_customer_id", "delivery_proof_photos", ["customer_id"])
    op.create_index("ix_delivery_proof_photos_uploaded_by_user_id", "delivery_proof_photos", ["uploaded_by_user_id"])


def downgrade() -> None:
    op.drop_index("ix_delivery_proof_photos_uploaded_by_user_id", table_name="delivery_proof_photos")
    op.drop_index("ix_delivery_proof_photos_customer_id", table_name="delivery_proof_photos")
    op.drop_index("ix_delivery_proof_photos_order_id", table_name="delivery_proof_photos")
    op.drop_table("delivery_proof_photos")
