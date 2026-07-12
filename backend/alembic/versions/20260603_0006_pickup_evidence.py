"""Pickup evidence photos — immutable append-only records.

Revision ID: 20260603_0006
Revises: 20260602_0005
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0006"
down_revision = "20260602_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pickup_evidence_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "order_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
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
        sa.Column("sort_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_pickup_evidence_photos_order_id", "pickup_evidence_photos", ["order_id"])
    op.create_index("ix_pickup_evidence_photos_customer_id", "pickup_evidence_photos", ["customer_id"])
    op.create_index("ix_pickup_evidence_photos_laundry_id", "pickup_evidence_photos", ["laundry_id"])
    op.create_index(
        "ix_pickup_evidence_photos_uploaded_by_user_id",
        "pickup_evidence_photos",
        ["uploaded_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_pickup_evidence_photos_uploaded_by_user_id", table_name="pickup_evidence_photos")
    op.drop_index("ix_pickup_evidence_photos_laundry_id", table_name="pickup_evidence_photos")
    op.drop_index("ix_pickup_evidence_photos_customer_id", table_name="pickup_evidence_photos")
    op.drop_index("ix_pickup_evidence_photos_order_id", table_name="pickup_evidence_photos")
    op.drop_table("pickup_evidence_photos")
