"""Platform ownership and profit sharing ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import PlatformExpenseCategory, ProfitSharePayoutStatus, ProfitSharePeriodStatus


class PlatformOwnershipPartner(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "platform_ownership_partners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    ownership_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    allocations: Mapped[list[ProfitShareAllocation]] = relationship(back_populates="partner")


class PlatformExpense(Base, TimestampMixin):
    __tablename__ = "platform_expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    category: Mapped[PlatformExpenseCategory] = mapped_column(
        Enum(PlatformExpenseCategory, name="platform_expense_category", native_enum=True),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )


class ProfitSharePeriod(Base, TimestampMixin):
    __tablename__ = "profit_share_periods"
    __table_args__ = (UniqueConstraint("period_year", "period_month", name="uq_profit_share_periods_year_month"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    revenue_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    expenses_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    profit_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    status: Mapped[ProfitSharePeriodStatus] = mapped_column(
        Enum(ProfitSharePeriodStatus, name="profit_share_period_status", native_enum=True),
        nullable=False,
        default=ProfitSharePeriodStatus.draft,
    )
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finalized_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    allocations: Mapped[list[ProfitShareAllocation]] = relationship(back_populates="period")


class ProfitShareAllocation(Base, TimestampMixin):
    __tablename__ = "profit_share_allocations"
    __table_args__ = (UniqueConstraint("period_id", "partner_id", name="uq_profit_share_allocations_period_partner"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profit_share_periods.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    partner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_ownership_partners.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    partner_name: Mapped[str] = mapped_column(String(120), nullable=False)
    ownership_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    earnings_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payout_status: Mapped[ProfitSharePayoutStatus] = mapped_column(
        Enum(ProfitSharePayoutStatus, name="profit_share_payout_status", native_enum=True),
        nullable=False,
        default=ProfitSharePayoutStatus.pending,
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    paid_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    period: Mapped[ProfitSharePeriod] = relationship(back_populates="allocations")
    partner: Mapped[PlatformOwnershipPartner] = relationship(back_populates="allocations")
