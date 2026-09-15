"""Laundry partner businesses."""

from __future__ import annotations

import uuid
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Boolean, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import LaundryStatus, FraudRiskLevel


class Laundry(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "laundries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    address_line: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    status: Mapped[LaundryStatus] = mapped_column(
        Enum(LaundryStatus, name="laundry_status", native_enum=True),
        nullable=False,
        default=LaundryStatus.pending_approval,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    commission_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    avg_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=Decimal("0"))
    review_count: Mapped[int] = mapped_column(nullable=False, default=0)
    image_urls: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable=False,
        server_default=sa.text("'{}'"),
    )
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)
    trust_score: Mapped[int] = mapped_column(nullable=False, default=70, server_default="70")
    fraud_risk_level: Mapped[FraudRiskLevel] = mapped_column(
        Enum(FraudRiskLevel, name="fraud_risk_level", native_enum=True),
        nullable=False,
        default=FraudRiskLevel.low,
        server_default="low",
    )

    services: Mapped[list[LaundryService]] = relationship(back_populates="laundry")  # noqa: F821
    garment_items: Mapped[list["LaundryGarmentItem"]] = relationship(  # noqa: F821
        back_populates="laundry",
    )


class LaundryService(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "laundry_services"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laundry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False, default="piece")
    price_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(nullable=True)
    express_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pickup_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    delivery_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    catalog_status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    view_count: Mapped[int] = mapped_column(nullable=False, default=0)
    order_count: Mapped[int] = mapped_column(nullable=False, default=0)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    laundry: Mapped[Laundry] = relationship(back_populates="services")
    service_garments: Mapped[list["LaundryServiceGarment"]] = relationship(  # noqa: F821
        back_populates="service",
        cascade="all, delete-orphan",
    )


class LaundryServiceGarment(Base, TimestampMixin):
    """Which catalog garments may be used with this laundry service."""

    __tablename__ = "laundry_service_garments"
    __table_args__ = (
        sa.UniqueConstraint(
            "laundry_service_id",
            "garment_item_id",
            name="uq_laundry_service_garments_service_garment",
        ),
        sa.Index("ix_laundry_service_garments_laundry_service_id", "laundry_service_id"),
        sa.Index("ix_laundry_service_garments_garment_item_id", "garment_item_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laundry_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundry_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    garment_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundry_garment_items.id", ondelete="CASCADE"),
        nullable=False,
    )

    service: Mapped[LaundryService] = relationship(back_populates="service_garments")
