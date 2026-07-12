"""Dispute drawer fraud risk context schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import FraudRiskLevel


class DisputePartyRiskProfile(BaseModel):
    risk_score: int = Field(ge=0, le=100, description="0=safe, 100=highest risk")
    risk_level: FraudRiskLevel
    risk_label: str
    trust_score: int = Field(ge=0, le=100)
    dispute_frequency_30d: int = 0
    dispute_frequency_pct: str = "0%"
    refund_rate_pct: str = "0%"
    previous_claims: int = 0
    previous_complaints: int = 0


class DisputeFraudRiskContext(BaseModel):
    overall_risk_level: FraudRiskLevel
    overall_risk_label: str
    customer: DisputePartyRiskProfile
    partner: DisputePartyRiskProfile | None = None
