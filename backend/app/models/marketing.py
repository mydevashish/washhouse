"""Public marketing site persistence — contact, franchise, stats, testimonials."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.models.enums import MarketingContactSubject, MarketingInvestmentRange

MARKETING_STATS_SINGLETON_KEY = "default"


class MarketingContactSubmission(Base, TimestampMixin):
    __tablename__ = "marketing_contact_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    subject: Mapped[MarketingContactSubject] = mapped_column(
        Enum(MarketingContactSubject, name="marketing_contact_subject", native_enum=True),
        nullable=False,
        index=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True, index=True)


class MarketingFranchiseInquiry(Base, TimestampMixin):
    __tablename__ = "marketing_franchise_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    investment_range: Mapped[MarketingInvestmentRange] = mapped_column(
        Enum(MarketingInvestmentRange, name="marketing_investment_range", native_enum=True),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True, index=True)


class MarketingSiteStats(Base, TimestampMixin):
    """Singleton row for optional curated stat overrides (key = 'default')."""

    __tablename__ = "marketing_site_stats"
    __table_args__ = (
        sa.CheckConstraint(
            "singleton_key = 'default'",
            name="ck_marketing_site_stats_singleton_key",
        ),
    )

    singleton_key: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=MARKETING_STATS_SINGLETON_KEY,
    )
    happy_customers_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cities_covered_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pickup_points_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    garments_cleaned_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_review_rating_override: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    last_aggregated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MarketingTestimonial(Base, TimestampMixin):
    __tablename__ = "marketing_testimonials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
