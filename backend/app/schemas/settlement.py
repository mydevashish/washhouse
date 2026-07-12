"""Settlement & payout API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SettlementDashboardResponse(BaseModel):
    total_pending_settlements_inr: str
    total_paid_settlements_inr: str
    today_payouts_inr: str
    monthly_payouts_inr: str
    partner_earnings_inr: str
    platform_commission_inr: str
    pending_count: int
    paid_count: int
    on_hold_count: int = 0
    on_hold_inr: str = "0.00"


class SettlementStatusBreakdownRow(BaseModel):
    status: str
    count: int
    total_inr: str


class SettlementMonthlyPayoutRow(BaseModel):
    month: str
    payout_inr: str
    commission_inr: str
    settlement_count: int


class SettlementTopPartnerRow(BaseModel):
    partner_user_id: UUID
    partner_name: str
    laundry_name: str
    paid_inr: str
    settlement_count: int


class SettlementAnalyticsResponse(BaseModel):
    status_breakdown: list[SettlementStatusBreakdownRow]
    monthly_payouts: list[SettlementMonthlyPayoutRow]
    top_partners: list[SettlementTopPartnerRow]
    total_gross_paid_inr: str
    total_commission_paid_inr: str
    avg_settlement_inr: str


class SettlementAuditRow(BaseModel):
    id: str
    timestamp: datetime
    user_name: str
    action: str
    settlement_id: str | None = None
    settlement_code: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    note: str | None = None


class SettlementTableRow(BaseModel):
    id: UUID
    settlement_code: str
    laundry_id: UUID
    laundry_name: str
    partner_user_id: UUID
    partner_name: str
    partner_email: str | None = None
    period_start: datetime
    period_end: datetime
    orders_count: int
    gross_revenue_inr: str
    commission_inr: str
    refund_inr: str
    adjustment_inr: str
    net_amount_inr: str
    status: str
    created_at: datetime
    paid_at: datetime | None = None
    payout_reference: str | None = None


class PaginatedSettlementTableResponse(BaseModel):
    items: list[SettlementTableRow]
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool = False
    has_previous: bool = False
    total: int | None = None  # legacy alias


class SettlementLineItemResponse(BaseModel):
    order_id: UUID
    gross_inr: str
    commission_inr: str
    refund_inr: str
    net_inr: str


class SettlementAdjustmentResponse(BaseModel):
    id: UUID
    amount_inr: str
    reason: str
    created_at: datetime


class SettlementDetailResponse(BaseModel):
    id: UUID
    settlement_code: str
    laundry_id: UUID
    laundry_name: str
    partner_user_id: UUID
    period_start: datetime
    period_end: datetime
    orders_count: int
    gross_revenue_inr: str
    commission_inr: str
    refund_inr: str
    adjustment_inr: str
    net_amount_inr: str
    status: str
    created_at: datetime
    approved_at: datetime | None = None
    paid_at: datetime | None = None
    payout_reference: str | None = None
    failed_reason: str | None = None
    cancelled_reason: str | None = None
    notes: str | None = None
    held_at: datetime | None = None
    held_reason: str | None = None
    partner_name: str | None = None
    line_items: list[SettlementLineItemResponse] = Field(default_factory=list)
    adjustments: list[SettlementAdjustmentResponse] = Field(default_factory=list)


class SettlementActionRequest(BaseModel):
    reason: str | None = None
    payout_reference: str | None = None


class SettlementAdjustmentRequest(BaseModel):
    amount_inr: Decimal
    reason: str = Field(min_length=3, max_length=500)


class PartnerSettlementRow(BaseModel):
    id: UUID
    settlement_code: str
    laundry_name: str
    period_start: datetime
    period_end: datetime
    orders_count: int
    gross_revenue_inr: str
    commission_inr: str
    refund_inr: str
    adjustment_inr: str
    net_amount_inr: str
    status: str
    created_at: datetime
    paid_at: datetime | None = None


class PartnerSettlementSummaryResponse(BaseModel):
    pending_earnings_inr: str
    available_earnings_inr: str
    in_flight_settlements_inr: str
    released_earnings_inr: str
    items: list[PartnerSettlementRow] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 25
    total_pages: int = 1


class SettlementRunResponse(BaseModel):
    settlements_created: int
    eligibility_updated: int
