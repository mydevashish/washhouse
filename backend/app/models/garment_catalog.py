"""Partner garment rate card — garment rows + per-service-type prices."""

from __future__ import annotations

import uuid
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import GarmentCategory, GarmentServiceType


class LaundryGarmentItem(Base, TimestampMixin, SoftDeleteMixin):
    """Partner-owned garment identity row (Default.xls Garment + GarmentCode)."""

    __tablename__ = "laundry_garment_items"
    __table_args__ = (
        sa.Index(
            "uq_laundry_garment_items_laundry_code_active",
            "laundry_id",
            sa.text("lower(garment_code)"),
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index(
            "ix_laundry_garment_items_laundry_category",
            "laundry_id",
            "category",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index(
            "ix_laundry_garment_items_laundry_visible",
            "laundry_id",
            "is_visible",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index("ix_laundry_garment_items_laundry_id", "laundry_id"),
        sa.Index("ix_laundry_garment_items_platform_catalog_item_id", "platform_catalog_item_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laundry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="CASCADE"),
        nullable=False,
    )
    category: Mapped[GarmentCategory] = mapped_column(
        Enum(GarmentCategory, name="garment_category", native_enum=True),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    garment_code: Mapped[str] = mapped_column(String(20), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    platform_catalog_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_catalog_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    service_rates: Mapped[list[LaundryGarmentServiceRate]] = relationship(
        back_populates="garment_item",
        cascade="all, delete-orphan",
    )
    laundry: Mapped["Laundry"] = relationship(back_populates="garment_items")  # noqa: F821


class LaundryGarmentServiceRate(Base, TimestampMixin, SoftDeleteMixin):
    """Price for one service type on a garment (nullable price = not offered)."""

    __tablename__ = "laundry_garment_service_rates"
    __table_args__ = (
        sa.CheckConstraint(
            "price_inr IS NULL OR price_inr >= 0",
            name="ck_laundry_garment_service_rates_price_nonneg",
        ),
        sa.Index(
            "uq_laundry_garment_rates_item_type_active",
            "garment_item_id",
            "service_type",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        sa.Index("ix_laundry_garment_service_rates_garment_item_id", "garment_item_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    garment_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundry_garment_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_type: Mapped[GarmentServiceType] = mapped_column(
        Enum(GarmentServiceType, name="garment_service_type", native_enum=True),
        nullable=False,
    )
    price_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    garment_item: Mapped[LaundryGarmentItem] = relationship(back_populates="service_rates")
