"""Shop-scoped customers — unique phone per laundry."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import sqlalchemy as sa

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class LaundryCustomer(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "laundry_customers"
    __table_args__ = (
        sa.Index(
            "uq_laundry_customers_laundry_phone_active",
            "laundry_id",
            "phone",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index("ix_laundry_customers_laundry_id", "laundry_id"),
        sa.Index("ix_laundry_customers_user_id", "user_id"),
        sa.Index("ix_laundry_customers_phone", "phone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laundry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str | None] = mapped_column(String(10), nullable=True)
    plan_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    registered_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    orders: Mapped[list["Order"]] = relationship(back_populates="laundry_customer")  # noqa: F821
