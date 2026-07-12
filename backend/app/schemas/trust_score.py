"""Customer trust score API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import TrustScoreEventType, TrustScoreLevel

TRUST_SCORE_EVENT_LABELS: dict[TrustScoreEventType, str] = {
    TrustScoreEventType.refund_request: "Refund Request",
    TrustScoreEventType.dispute_filed: "Dispute Filed",
    TrustScoreEventType.chargeback: "Chargeback",
    TrustScoreEventType.failed_payment: "Failed Payment",
    TrustScoreEventType.fake_claim: "Fake Claim (Rejected Dispute)",
    TrustScoreEventType.successful_order: "Successful Order",
    TrustScoreEventType.positive_review: "Positive Review",
    TrustScoreEventType.long_history: "Long Customer History",
}

TRUST_LEVEL_LABELS: dict[TrustScoreLevel, str] = {
    TrustScoreLevel.gold: "Gold",
    TrustScoreLevel.silver: "Silver",
    TrustScoreLevel.bronze: "Bronze",
    TrustScoreLevel.high_risk: "High Risk",
}


class TrustScoreEventResponse(BaseModel):
    id: UUID
    user_id: UUID
    event_type: TrustScoreEventType
    label: str
    delta: int
    score_before: int
    score_after: int
    reference_type: str | None
    reference_id: UUID | None
    metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerTrustScoreSummary(BaseModel):
    user_id: UUID
    full_name: str
    email: str | None
    phone: str | None = None
    role: str = "customer"
    trust_score: int
    level: TrustScoreLevel
    level_label: str
    risk_level: str | None = None
    delivered_orders: int
    dispute_count: int = 0
    refund_count: int = 0
    status: str = "active"
    created_at: datetime


class CustomerTrustScoreDetail(CustomerTrustScoreSummary):
    events: list[TrustScoreEventResponse]
