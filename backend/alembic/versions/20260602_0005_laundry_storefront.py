"""Laundry partner storefront profiles.

Revision ID: 20260602_0005
Revises: 20260602_0004
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260602_0005"
down_revision = "20260602_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "laundry_storefronts",
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("template_id", sa.String(40), nullable=False, server_default="premium"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("logo_url", sa.String(2000), nullable=True),
        sa.Column("cover_url", sa.String(2000), nullable=True),
        sa.Column("brand_primary", sa.String(7), nullable=True),
        sa.Column("brand_secondary", sa.String(7), nullable=True),
        sa.Column("tagline", sa.String(300), nullable=True),
        sa.Column("brand_story", sa.Text(), nullable=True),
        sa.Column("years_in_business", sa.Integer(), nullable=True),
        sa.Column("owner_name", sa.String(120), nullable=True),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("working_hours", postgresql.JSONB(), nullable=True),
        sa.Column("pickup_radius_km", sa.Numeric(5, 2), nullable=True),
        sa.Column("delivery_radius_km", sa.Numeric(5, 2), nullable=True),
        sa.Column("facilities", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("highlights", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("gallery", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("machines", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("team", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("certifications", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("videos", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("completeness_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("laundry_storefronts")
