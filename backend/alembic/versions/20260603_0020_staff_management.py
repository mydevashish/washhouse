"""Enterprise staff management migration.

Revision ID: 20260603_0020
Revises: 20260603_0019
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0020"
down_revision = "20260603_0019"
branch_labels = None
depends_on = None

staff_activity_action = postgresql.ENUM(
    "login",
    "logout",
    "order_update",
    "assignment",
    "status_change",
    "staff_created",
    "staff_updated",
    "staff_deactivated",
    "password_reset",
    name="staff_activity_action",
    create_type=False,
)

_NEW_STAFF_ROLES = (
    "owner",
    "manager",
    "pickup_agent",
    "delivery_agent",
    "operator",
    "support_staff",
)


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'partner_staff'")
        for value in _NEW_STAFF_ROLES:
            op.execute(f"ALTER TYPE partner_staff_role ADD VALUE IF NOT EXISTS '{value}'")

    staff_activity_action.create(op.get_bind(), checkfirst=True)

    op.add_column("partner_staff", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("partner_staff", sa.Column("email", sa.String(320), nullable=True))
    op.add_column("partner_staff", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("partner_staff", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("partner_staff", sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("partner_staff", sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))

    op.create_foreign_key(
        "fk_partner_staff_user_id",
        "partner_staff",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_partner_staff_created_by",
        "partner_staff",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_partner_staff_user_id", "partner_staff", ["user_id"], unique=True)
    op.create_index("ix_partner_staff_email", "partner_staff", ["email"])
    op.create_index("ix_partner_staff_is_active", "partner_staff", ["is_active"])

    op.create_table(
        "staff_activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partner_staff.id", ondelete="SET NULL"), nullable=True),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", staff_activity_action, nullable=False),
        sa.Column("resource_type", sa.String(80), nullable=True),
        sa.Column("resource_id", sa.String(80), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_staff_activity_logs_staff_id", "staff_activity_logs", ["staff_id"])
    op.create_index("ix_staff_activity_logs_laundry_id", "staff_activity_logs", ["laundry_id"])
    op.create_index("ix_staff_activity_logs_action", "staff_activity_logs", ["action"])

    op.execute("UPDATE partner_staff SET role = 'pickup_agent' WHERE role = 'pickup_only'")
    op.execute("UPDATE partner_staff SET role = 'delivery_agent' WHERE role = 'delivery_only'")
    op.execute("UPDATE partner_staff SET role = 'operator' WHERE role = 'inventory'")
    op.execute("UPDATE partner_staff SET role = 'manager' WHERE role = 'full_access'")
    op.execute("UPDATE partner_staff SET is_active = true WHERE is_active IS NULL")


def downgrade() -> None:
    op.drop_index("ix_staff_activity_logs_action", table_name="staff_activity_logs")
    op.drop_index("ix_staff_activity_logs_laundry_id", table_name="staff_activity_logs")
    op.drop_index("ix_staff_activity_logs_staff_id", table_name="staff_activity_logs")
    op.drop_table("staff_activity_logs")

    op.drop_index("ix_partner_staff_is_active", table_name="partner_staff")
    op.drop_index("ix_partner_staff_email", table_name="partner_staff")
    op.drop_index("ix_partner_staff_user_id", table_name="partner_staff")
    op.drop_constraint("fk_partner_staff_created_by", "partner_staff", type_="foreignkey")
    op.drop_constraint("fk_partner_staff_user_id", "partner_staff", type_="foreignkey")
    op.drop_column("partner_staff", "created_by_user_id")
    op.drop_column("partner_staff", "last_active_at")
    op.drop_column("partner_staff", "last_login_at")
    op.drop_column("partner_staff", "is_active")
    op.drop_column("partner_staff", "email")
    op.drop_column("partner_staff", "user_id")

    staff_activity_action.drop(op.get_bind(), checkfirst=True)
