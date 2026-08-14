"""Partner shop-scoped coupons + order discount columns.

Revision ID: 20260809_0042
Revises: 20260808_0041
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "20260809_0042"
down_revision = "20260808_0041"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    return column in {c["name"] for c in inspect(bind).get_columns(table)}


def _has_unique_constraint(table: str, name: str) -> bool:
    bind = op.get_bind()
    return any(
        uc["name"] == name for uc in inspect(bind).get_unique_constraints(table)
    )


def _has_index(table: str, name: str) -> bool:
    bind = op.get_bind()
    return any(idx["name"] == name for idx in inspect(bind).get_indexes(table))


def _drop_coupon_code_uniqueness() -> None:
    """Drop legacy global unique on coupons.code (constraint or index name may vary)."""
    bind = op.get_bind()
    insp = inspect(bind)

    for uc in insp.get_unique_constraints("coupons"):
        if uc["column_names"] == ["code"]:
            op.drop_constraint(uc["name"], "coupons", type_="unique")
            return

    for idx in insp.get_indexes("coupons"):
        if idx.get("unique") and idx["column_names"] == ["code"]:
            op.drop_index(idx["name"], table_name="coupons")
            return

    # Render/prod may use the default PG name even when inspector misses it.
    op.execute(
        text(
            """
            DO $$ BEGIN
                ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_code_key;
            EXCEPTION
                WHEN undefined_object THEN NULL;
            END $$;
            """
        )
    )
    op.execute(text("DROP INDEX IF EXISTS coupons_code_key"))


def upgrade() -> None:
    _drop_coupon_code_uniqueness()

    if not _has_column("coupons", "laundry_id"):
        op.add_column(
            "coupons",
            sa.Column(
                "laundry_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("laundries.id", ondelete="CASCADE"),
                nullable=True,
            ),
        )

    op.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_coupons_laundry_id ON coupons (laundry_id)"
        )
    )

    # Drop duplicate rows before composite unique (safe if table is already clean).
    op.execute(
        text(
            """
            DELETE FROM coupons AS newer
            USING coupons AS older
            WHERE newer.id > older.id
              AND newer.code = older.code
              AND newer.laundry_id IS NOT DISTINCT FROM older.laundry_id
            """
        )
    )

    if not _has_unique_constraint("coupons", "uq_coupons_laundry_code"):
        op.create_unique_constraint(
            "uq_coupons_laundry_code", "coupons", ["laundry_id", "code"]
        )

    if not _has_column("orders", "coupon_code"):
        op.add_column("orders", sa.Column("coupon_code", sa.String(32), nullable=True))

    if not _has_column("orders", "discount_inr"):
        op.add_column(
            "orders",
            sa.Column("discount_inr", sa.Numeric(12, 2), nullable=False, server_default="0"),
        )


def downgrade() -> None:
    if _has_column("orders", "discount_inr"):
        op.drop_column("orders", "discount_inr")
    if _has_column("orders", "coupon_code"):
        op.drop_column("orders", "coupon_code")

    if _has_unique_constraint("coupons", "uq_coupons_laundry_code"):
        op.drop_constraint("uq_coupons_laundry_code", "coupons", type_="unique")

    if _has_index("coupons", "ix_coupons_laundry_id"):
        op.drop_index("ix_coupons_laundry_id", table_name="coupons")

    if _has_column("coupons", "laundry_id"):
        op.drop_column("coupons", "laundry_id")

    if not _has_unique_constraint("coupons", "coupons_code_key") and not any(
        idx.get("unique") and idx["column_names"] == ["code"]
        for idx in inspect(op.get_bind()).get_indexes("coupons")
    ):
        op.create_unique_constraint("coupons_code_key", "coupons", ["code"])
