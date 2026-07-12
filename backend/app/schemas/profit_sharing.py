"""Profit sharing Pydantic schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class OwnershipPartnerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    ownership_pct: Decimal = Field(gt=Decimal("0"), le=Decimal("100"))
    user_id: UUID | None = None
    notes: str | None = None


class OwnershipPartnerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    ownership_pct: Decimal | None = Field(default=None, gt=Decimal("0"), le=Decimal("100"))
    user_id: UUID | None = None
    is_active: bool | None = None
    notes: str | None = None


class OwnershipPartnerRow(BaseModel):
    id: UUID
    name: str
    ownership_pct: str
    user_id: UUID | None
    is_active: bool
    notes: str | None
    created_at: str
    updated_at: str


class PlatformExpenseCreate(BaseModel):
    period_year: int = Field(ge=2020, le=2100)
    period_month: int = Field(ge=1, le=12)
    category: str
    description: str = Field(min_length=1, max_length=2000)
    amount_inr: Decimal = Field(gt=Decimal("0"))


class PlatformExpenseRow(BaseModel):
    id: UUID
    period_year: int
    period_month: int
    category: str
    description: str
    amount_inr: str
    recorded_by: UUID
    created_at: str


class PeriodPreview(BaseModel):
    period_year: int
    period_month: int
    revenue_inr: str
    expenses_inr: str
    profit_inr: str
    is_finalized: bool


class ProfitShareAllocationRow(BaseModel):
    id: UUID
    period_id: UUID
    period_year: int
    period_month: int
    partner_id: UUID
    partner_name: str
    ownership_pct: str
    earnings_inr: str
    payout_status: str
    paid_at: str | None
    payment_reference: str | None


class ProfitSharePeriodRow(BaseModel):
    id: UUID
    period_year: int
    period_month: int
    revenue_inr: str
    expenses_inr: str
    profit_inr: str
    status: str
    finalized_at: str | None
    allocations: list[ProfitShareAllocationRow] = Field(default_factory=list)


class ProfitSharingOverview(BaseModel):
    ownership_total_pct: str
    ownership_valid: bool
    partners: list[OwnershipPartnerRow]
    pending_payouts_inr: str
    paid_payouts_inr: str
    current_period: PeriodPreview
    recent_payouts: list[ProfitShareAllocationRow]


class MarkPayoutPaidRequest(BaseModel):
    payment_reference: str = Field(min_length=1, max_length=128)

    @field_validator("payment_reference")
    @classmethod
    def strip_reference(cls, v: str) -> str:
        return v.strip()


class FinalizePeriodRequest(BaseModel):
    period_year: int = Field(ge=2020, le=2100)
    period_month: int = Field(ge=1, le=12)


class PartnerProfitSharingSummary(BaseModel):
    partner_id: UUID | None
    partner_name: str | None
    ownership_pct: str | None
    pending_earnings_inr: str
    paid_earnings_inr: str
    pending_allocations: list[ProfitShareAllocationRow]
    payout_history: list[ProfitShareAllocationRow]
