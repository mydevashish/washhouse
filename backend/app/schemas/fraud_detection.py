"""Fraud detection API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import FraudAlertStatus, FraudRiskLevel, FraudSignalType, FraudSubjectType

FRAUD_RISK_LABELS: dict[FraudRiskLevel, str] = {
    FraudRiskLevel.low: "Low",
    FraudRiskLevel.medium: "Medium",
    FraudRiskLevel.high: "High",
    FraudRiskLevel.critical: "Critical",
}

FRAUD_SIGNAL_LABELS: dict[FraudSignalType, str] = {
    FraudSignalType.customer_dispute_spike: "Dispute spike",
    FraudSignalType.customer_refund_rate: "High refund rate",
    FraudSignalType.customer_payment_failures: "Payment failures",
    FraudSignalType.customer_cancellations: "Frequent cancellations",
    FraudSignalType.partner_excessive_complaints: "Excessive complaints",
    FraudSignalType.partner_inventory_mismatch: "Inventory mismatches",
    FraudSignalType.partner_delivery_fraud: "Delivery fraud pattern",
}


class FraudSignalResult(BaseModel):
    signal_type: FraudSignalType
    label: str
    severity: int = Field(ge=0, le=3)
    risk_level: FraudRiskLevel
    detail: str
    metadata: dict | None = None


class FraudEvaluationResult(BaseModel):
    subject_type: FraudSubjectType
    subject_id: UUID
    subject_name: str
    risk_level: FraudRiskLevel
    risk_label: str
    signals: list[FraudSignalResult]
    alerts_created: int
    evaluated_at: datetime


class FraudAlertResponse(BaseModel):
    id: UUID
    subject_type: FraudSubjectType
    subject_id: UUID
    subject_name: str | None = None
    signal_type: FraudSignalType
    signal_label: str
    risk_level: FraudRiskLevel
    risk_label: str
    title: str
    description: str
    status: FraudAlertStatus
    reference_type: str | None
    reference_id: UUID | None
    metadata: dict | None
    created_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None


class FraudRiskSummary(BaseModel):
    open_by_risk: dict[str, int]
    total_open: int
