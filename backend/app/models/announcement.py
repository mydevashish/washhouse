"""Platform announcements."""

from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.models.enums import (
    AnnouncementEventType,
    AnnouncementStatus,
    AnnouncementTarget,
)


class Announcement(Base, TimestampMixin):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AnnouncementStatus] = mapped_column(
        Enum(AnnouncementStatus, name="announcement_status", native_enum=True),
        nullable=False,
        default=AnnouncementStatus.draft,
        index=True,
    )
    target_type: Mapped[AnnouncementTarget] = mapped_column(
        Enum(AnnouncementTarget, name="announcement_target", native_enum=True),
        nullable=False,
    )
    target_laundry_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=False,
        server_default=sa.text("'{}'"),
    )
    target_cities: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable=False,
        server_default=sa.text("'{}'"),
    )
    channel_in_app: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    channel_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    channel_push: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    requires_acknowledgement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    click_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    acknowledgement_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")


class AnnouncementEvent(Base):
    __tablename__ = "announcement_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    announcement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("announcements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[AnnouncementEventType] = mapped_column(
        Enum(AnnouncementEventType, name="announcement_event_type", native_enum=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )
