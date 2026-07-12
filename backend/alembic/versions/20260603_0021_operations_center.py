"""Pickup & delivery operations center migration.

Revision ID: 20260603_0021
Revises: 20260603_0020
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260603_0021"
down_revision = "20260603_0020"
branch_labels = None
depends_on = None

task_assignment_type = postgresql.ENUM("pickup", "delivery", name="task_assignment_type", create_type=False)
task_assignment_status = postgresql.ENUM(
    "scheduled",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
    "failed",
    "returned",
    name="task_assignment_status",
    create_type=False,
)


def upgrade() -> None:
    task_assignment_type.create(op.get_bind(), checkfirst=True)
    task_assignment_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "partner_staff",
        sa.Column("daily_capacity", sa.Integer(), nullable=False, server_default="8"),
    )

    op.create_table(
        "order_task_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("laundry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_type", task_assignment_type, nullable=False),
        sa.Column("staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partner_staff.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", task_assignment_status, nullable=False, server_default="assigned"),
        sa.Column("assigned_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_order_task_assignments_order_id", "order_task_assignments", ["order_id"])
    op.create_index("ix_order_task_assignments_laundry_id", "order_task_assignments", ["laundry_id"])
    op.create_index("ix_order_task_assignments_staff_id", "order_task_assignments", ["staff_id"])
    op.create_index("ix_order_task_assignments_task_type", "order_task_assignments", ["task_type"])
    op.create_index("ix_order_task_assignments_status", "order_task_assignments", ["status"])


def downgrade() -> None:
    op.drop_table("order_task_assignments")
    op.drop_column("partner_staff", "daily_capacity")
    task_assignment_status.drop(op.get_bind(), checkfirst=True)
    task_assignment_type.drop(op.get_bind(), checkfirst=True)
