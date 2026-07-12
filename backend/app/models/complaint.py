"""Customer complaints."""

from __future__ import annotations

import uuid

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ComplaintStatus, ComplaintType, DisputePriority


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    complaint_type: Mapped[ComplaintType] = mapped_column(
        Enum(ComplaintType, name="complaint_type", native_enum=True),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, name="complaint_status", native_enum=True),
        nullable=False,
        default=ComplaintStatus.open,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[DisputePriority] = mapped_column(
        Enum(DisputePriority, name="dispute_priority", native_enum=True),
        nullable=False,
        default=DisputePriority.medium,
    )
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    photos: Mapped[list["ComplaintPhoto"]] = relationship(back_populates="complaint")  # noqa: F821
    internal_notes: Mapped[list["ComplaintInternalNote"]] = relationship(back_populates="complaint")  # noqa: F821
