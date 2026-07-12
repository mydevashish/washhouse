"""Laundry trust score API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import LaundryTrustLevel

LAUNDRY_TRUST_LEVEL_LABELS: dict[LaundryTrustLevel, str] = {
    LaundryTrustLevel.premium: "Premium",
    LaundryTrustLevel.trusted: "Trusted",
    LaundryTrustLevel.verified: "Verified",
    LaundryTrustLevel.under_review: "Under Review",
}


class LaundryTrustMetrics(BaseModel):
    on_time_delivery_pct: float = Field(description="0-100 percentage")
    complaint_rate_pct: float = Field(description="Complaints per 100 completed orders")
    refund_rate_pct: float = Field(description="Refunds per 100 completed orders")
    dispute_rate_pct: float = Field(description="Active disputes per 100 completed orders")
    avg_rating: float
    review_count: int
    completed_orders: int


class LaundryTrustScoreSummary(BaseModel):
    laundry_id: UUID
    laundry_name: str
    city: str
    owner_name: str | None = None
    trust_score: int
    level: LaundryTrustLevel
    level_label: str
    metrics: LaundryTrustMetrics
    calculated_at: datetime


class LaundryTrustScoreDetail(LaundryTrustScoreSummary):
    score_breakdown: dict[str, float]
