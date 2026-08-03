"""Booking request aggregate — marketplace Book Now / phone CRM inbox."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import (
    BookingRequestCreatedByRole,
    BookingRequestEventType,
    BookingRequestMessageAuthorRole,
    BookingRequestMessageVisibility,
    BookingRequestPreferredTime,
    BookingRequestPriority,
    BookingRequestServiceType,
    BookingRequestSource,
    BookingRequestStatus,
)

BOOKING_REQUEST_OPEN_STATUSES: tuple[BookingRequestStatus, ...] = (
    BookingRequestStatus.new,
    BookingRequestStatus.reviewing,
    BookingRequestStatus.assigned,
    BookingRequestStatus.contacted,
    BookingRequestStatus.confirmed,
)

BOOKING_REQUEST_TERMINAL_STATUSES: tuple[BookingRequestStatus, ...] = (
    BookingRequestStatus.converted_to_order,
    BookingRequestStatus.declined,
    BookingRequestStatus.expired,
    BookingRequestStatus.cancelled,
)


def _enum_values(enum_cls: type) -> list[str]:
    """Persist enum *values* (wash-fold) so ORM matches Alembic + public API."""
    return [member.value for member in enum_cls]


class BookingRequest(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "booking_requests"
    __table_args__ = (
        Index(
            "ix_booking_requests_phone_e164_created_at",
            "phone_e164",
            "created_at",
        ),
        Index(
            "ix_booking_requests_status_created_at",
            "status",
            "created_at",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "ix_booking_requests_assigned_laundry_id_status",
            "assigned_laundry_id",
            "status",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index("ix_booking_requests_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    public_code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_e164: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    service_type: Mapped[BookingRequestServiceType] = mapped_column(
        Enum(
            BookingRequestServiceType,
            name="booking_request_service_type",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    preferred_time_window: Mapped[BookingRequestPreferredTime] = mapped_column(
        Enum(
            BookingRequestPreferredTime,
            name="booking_request_preferred_time",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    address_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[BookingRequestSource] = mapped_column(
        Enum(
            BookingRequestSource,
            name="booking_request_source",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        default=BookingRequestSource.marketing_home,
    )
    status: Mapped[BookingRequestStatus] = mapped_column(
        Enum(
            BookingRequestStatus,
            name="booking_request_status",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        default=BookingRequestStatus.new,
        index=True,
    )
    priority: Mapped[BookingRequestPriority] = mapped_column(
        Enum(
            BookingRequestPriority,
            name="booking_request_priority",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        default=BookingRequestPriority.normal,
        server_default="normal",
    )
    assigned_laundry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    converted_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_role: Mapped[BookingRequestCreatedByRole] = mapped_column(
        Enum(
            BookingRequestCreatedByRole,
            name="booking_request_created_by_role",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        default=BookingRequestCreatedByRole.public,
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    last_response_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["BookingRequestMessage"]] = relationship(
        back_populates="booking_request",
        cascade="all, delete-orphan",
        order_by="BookingRequestMessage.created_at",
    )
    events: Mapped[list["BookingRequestEvent"]] = relationship(
        back_populates="booking_request",
        cascade="all, delete-orphan",
        order_by="BookingRequestEvent.created_at",
    )


class BookingRequestMessage(Base):
    __tablename__ = "booking_request_messages"
    __table_args__ = (
        Index(
            "ix_booking_request_messages_request_id_created_at",
            "booking_request_id",
            "created_at",
        ),
        sa.CheckConstraint(
            "char_length(body) <= 4000",
            name="ck_booking_request_messages_body_len",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    author_role: Mapped[BookingRequestMessageAuthorRole] = mapped_column(
        Enum(
            BookingRequestMessageAuthorRole,
            name="booking_request_message_author_role",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    visibility: Mapped[BookingRequestMessageVisibility] = mapped_column(
        Enum(
            BookingRequestMessageVisibility,
            name="booking_request_message_visibility",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    booking_request: Mapped[BookingRequest] = relationship(back_populates="messages")


class BookingRequestEvent(Base):
    __tablename__ = "booking_request_events"
    __table_args__ = (
        Index(
            "ix_booking_request_events_request_id_created_at",
            "booking_request_id",
            "created_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[BookingRequestEventType] = mapped_column(
        Enum(
            BookingRequestEventType,
            name="booking_request_event_type",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    from_status: Mapped[BookingRequestStatus | None] = mapped_column(
        Enum(
            BookingRequestStatus,
            name="booking_request_status",
            native_enum=True,
            values_callable=_enum_values,
            create_type=False,
        ),
        nullable=True,
    )
    to_status: Mapped[BookingRequestStatus | None] = mapped_column(
        Enum(
            BookingRequestStatus,
            name="booking_request_status",
            native_enum=True,
            values_callable=_enum_values,
            create_type=False,
        ),
        nullable=True,
    )
    from_laundry_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    to_laundry_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    booking_request: Mapped[BookingRequest] = relationship(back_populates="events")
