"""Backfill storefront contact_phone from laundry owner phone.

Revision ID: 20260714_0033
Revises: 20260713_0032
"""

from __future__ import annotations

from alembic import op

revision = "20260714_0033"
down_revision = "20260713_0032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE laundry_storefronts sf
        SET
            contact_phone = u.phone,
            whatsapp_number = COALESCE(NULLIF(TRIM(sf.whatsapp_number), ''), u.phone)
        FROM laundries l
        JOIN users u ON u.id = l.owner_user_id
        WHERE sf.laundry_id = l.id
          AND (sf.contact_phone IS NULL OR TRIM(sf.contact_phone) = '')
          AND u.phone IS NOT NULL
          AND TRIM(u.phone) <> ''
        """,
    )


def downgrade() -> None:
    pass
