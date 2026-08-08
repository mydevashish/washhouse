"""Shop Floor color token columns on orders.

Revision ID: 20260808_0040
Revises: 20260804_0039
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260808_0040"
down_revision = "20260804_0039"
branch_labels = None
depends_on = None

_COLOR_TOKEN_VALUES = (
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "teal",
    "brown",
    "grey",
)


def upgrade() -> None:
    color_token = postgresql.ENUM(*_COLOR_TOKEN_VALUES, name="color_token", create_type=False)
    color_token.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "orders",
        sa.Column(
            "color_token",
            postgresql.ENUM(*_COLOR_TOKEN_VALUES, name="color_token", create_type=False),
            nullable=True,
        ),
    )
    op.add_column("orders", sa.Column("token_code", sa.String(16), nullable=True))
    op.add_column("orders", sa.Column("token_day_number", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("token_assigned_on", sa.Date(), nullable=True))

    op.create_index(
        "uq_orders_laundry_color_token_day",
        "orders",
        ["laundry_id", "color_token", "token_day_number", "token_assigned_on"],
        unique=True,
        postgresql_where=sa.text(
            "color_token IS NOT NULL AND token_day_number IS NOT NULL AND token_assigned_on IS NOT NULL",
        ),
    )
    op.create_index(
        "ix_orders_laundry_id_token_assigned_on",
        "orders",
        ["laundry_id", "token_assigned_on"],
        postgresql_where=sa.text("token_assigned_on IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_orders_laundry_id_token_assigned_on", table_name="orders")
    op.drop_index("uq_orders_laundry_color_token_day", table_name="orders")
    op.drop_column("orders", "token_assigned_on")
    op.drop_column("orders", "token_day_number")
    op.drop_column("orders", "token_code")
    op.drop_column("orders", "color_token")
    op.execute("DROP TYPE IF EXISTS color_token")
