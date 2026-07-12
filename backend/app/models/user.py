"""User account model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import UserRole, FraudRiskLevel


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("phone", name="uq_users_phone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str | None] = mapped_column(String(320), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        nullable=False,
        default=UserRole.customer,
    )
    is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    google_sub: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    delivery_otp_fail_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    delivery_otp_locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100, server_default="100")
    fraud_risk_level: Mapped[FraudRiskLevel] = mapped_column(
        Enum(FraudRiskLevel, name="fraud_risk_level", native_enum=True),
        nullable=False,
        default=FraudRiskLevel.low,
        server_default="low",
    )

    addresses: Mapped[list[UserAddress]] = relationship(  # noqa: F821
        back_populates="user",
        cascade="all, delete-orphan",
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(  # noqa: F821
        back_populates="user",
        cascade="all, delete-orphan",
    )
