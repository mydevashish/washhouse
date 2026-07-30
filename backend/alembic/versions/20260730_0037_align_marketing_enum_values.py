"""Align marketing PG enum labels with API/Python enum *values*.

SQLAlchemy's default Enum persistence uses member *names* (order_help), while
migration 20260713_0032 created labels from *values* (order-help). Environments
created via metadata/create_all therefore diverge from Alembic-created DBs.
Book Pickup posts subject=order-help and franchise posts investment_range=25-50;
name/value mismatch yields INTERNAL_ERROR (and browsers may surface that as a
network/CORS failure when ACAO is missing on 500s).

Revision ID: 20260730_0037
Revises: 20260729_0036
"""

from __future__ import annotations

from alembic import op

revision = "20260730_0037"
down_revision = "20260729_0036"
branch_labels = None
depends_on = None

# (type_name, name_label, value_label)
_RENAMES: tuple[tuple[str, str, str], ...] = (
    ("marketing_contact_subject", "order_help", "order-help"),
    ("marketing_contact_subject", "legal_privacy", "legal-privacy"),
    ("marketing_investment_range", "range_10_25", "10-25"),
    ("marketing_investment_range", "range_25_50", "25-50"),
    ("marketing_investment_range", "range_50_plus", "50-plus"),
)


def _rename_enum_label_if_needed(type_name: str, old: str, new: str) -> None:
    """Rename PG enum label when only the SQLAlchemy-name form exists."""
    op.execute(
        f"""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = '{type_name}' AND e.enumlabel = '{old}'
            ) AND NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = '{type_name}' AND e.enumlabel = '{new}'
            ) THEN
                ALTER TYPE {type_name} RENAME VALUE '{old}' TO '{new}';
            END IF;
        END $$;
        """
    )


def upgrade() -> None:
    for type_name, old, new in _RENAMES:
        _rename_enum_label_if_needed(type_name, old, new)
        # PG 15+: IF NOT EXISTS is safe when Alembic already created value labels.
        op.execute(f"ALTER TYPE {type_name} ADD VALUE IF NOT EXISTS '{new}'")


def downgrade() -> None:
    # Reverse rename only when the value-form exists and the name-form does not.
    for type_name, old, new in reversed(_RENAMES):
        _rename_enum_label_if_needed(type_name, new, old)
