"""Marketing site tables — contact, franchise, stats, testimonials.

Revision ID: 20260713_0032
Revises: 20260703_0031
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260713_0032"
down_revision = "20260703_0031"
branch_labels = None
depends_on = None

marketing_contact_subject = postgresql.ENUM(
    "general",
    "order-help",
    "franchise",
    "partnership",
    "legal-privacy",
    name="marketing_contact_subject",
    create_type=False,
)

marketing_investment_range = postgresql.ENUM(
    "10-25",
    "25-50",
    "50-plus",
    "unsure",
    name="marketing_investment_range",
    create_type=False,
)


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


def upgrade() -> None:
    _create_enum_if_not_exists(
        "marketing_contact_subject",
        "'general', 'order-help', 'franchise', 'partnership', 'legal-privacy'",
    )
    _create_enum_if_not_exists(
        "marketing_investment_range",
        "'10-25', '25-50', '50-plus', 'unsure'",
    )

    op.create_table(
        "marketing_contact_submissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("subject", marketing_contact_subject, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("client_ip", sa.String(45), nullable=True),
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
        sa.CheckConstraint("char_length(message) <= 2000", name="ck_marketing_contact_submissions_message_len"),
    )
    op.create_index(
        "ix_marketing_contact_submissions_phone",
        "marketing_contact_submissions",
        ["phone"],
    )
    op.create_index(
        "ix_marketing_contact_submissions_subject",
        "marketing_contact_submissions",
        ["subject"],
    )
    op.create_index(
        "ix_marketing_contact_submissions_client_ip_created_at",
        "marketing_contact_submissions",
        ["client_ip", "created_at"],
    )
    op.create_index(
        "ix_marketing_contact_submissions_phone_created_at",
        "marketing_contact_submissions",
        ["phone", "created_at"],
    )

    op.create_table(
        "marketing_franchise_inquiries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("investment_range", marketing_investment_range, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("client_ip", sa.String(45), nullable=True),
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
        sa.CheckConstraint("char_length(message) <= 2000", name="ck_marketing_franchise_inquiries_message_len"),
    )
    op.create_index(
        "ix_marketing_franchise_inquiries_phone",
        "marketing_franchise_inquiries",
        ["phone"],
    )
    op.create_index(
        "ix_marketing_franchise_inquiries_client_ip_created_at",
        "marketing_franchise_inquiries",
        ["client_ip", "created_at"],
    )

    op.create_table(
        "marketing_site_stats",
        sa.Column("singleton_key", sa.String(32), primary_key=True, server_default="default"),
        sa.Column("happy_customers_override", sa.Integer(), nullable=True),
        sa.Column("cities_covered_override", sa.Integer(), nullable=True),
        sa.Column("pickup_points_override", sa.Integer(), nullable=True),
        sa.Column("garments_cleaned_override", sa.Integer(), nullable=True),
        sa.Column("avg_review_rating_override", sa.Numeric(3, 2), nullable=True),
        sa.Column("last_aggregated_at", sa.TIMESTAMP(timezone=True), nullable=True),
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
        sa.CheckConstraint(
            "singleton_key = 'default'",
            name="ck_marketing_site_stats_singleton_key",
        ),
    )
    op.execute(
        """
        INSERT INTO marketing_site_stats (singleton_key)
        VALUES ('default')
        ON CONFLICT (singleton_key) DO NOTHING
        """
    )

    op.create_table(
        "marketing_testimonials",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("location", sa.String(120), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=False),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
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
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_marketing_testimonials_rating_range"),
    )
    op.create_index(
        "ix_marketing_testimonials_featured_active_sort",
        "marketing_testimonials",
        ["is_featured", "is_active", "sort_order"],
    )


def downgrade() -> None:
    op.drop_index("ix_marketing_testimonials_featured_active_sort", table_name="marketing_testimonials")
    op.drop_table("marketing_testimonials")
    op.drop_table("marketing_site_stats")
    op.drop_index(
        "ix_marketing_franchise_inquiries_client_ip_created_at",
        table_name="marketing_franchise_inquiries",
    )
    op.drop_index("ix_marketing_franchise_inquiries_phone", table_name="marketing_franchise_inquiries")
    op.drop_table("marketing_franchise_inquiries")
    op.drop_index(
        "ix_marketing_contact_submissions_phone_created_at",
        table_name="marketing_contact_submissions",
    )
    op.drop_index(
        "ix_marketing_contact_submissions_client_ip_created_at",
        table_name="marketing_contact_submissions",
    )
    op.drop_index("ix_marketing_contact_submissions_subject", table_name="marketing_contact_submissions")
    op.drop_index("ix_marketing_contact_submissions_phone", table_name="marketing_contact_submissions")
    op.drop_table("marketing_contact_submissions")
    op.execute("DROP TYPE marketing_investment_range")
    op.execute("DROP TYPE marketing_contact_subject")
