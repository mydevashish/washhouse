"""Admin dispute datatable API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ComplaintStatus, ComplaintType, DisputePriority
from app.schemas.complaint import ComplaintDetailResponse
from app.schemas.dispute_fraud_risk import DisputeFraudRiskContext

DISPUTE_TYPE_LABELS_EXT: dict[str, str] = {
    "missing_item": "Missing Item",
    "missing_items": "Missing Item",
    "damaged_item": "Damaged Item",
    "damaged_items": "Damaged Item",
    "wrong_item": "Wrong Item",
    "late_delivery": "Late Delivery",
    "delayed_delivery": "Late Delivery",
    "quality_issue": "Quality Issue",
    "refund_request": "Refund Request",
    "payment_issue": "Payment Issue",
    "other": "Other",
}

DISPUTE_STATUS_LABELS_EXT: dict[str, str] = {
    "open": "Open",
    "investigating": "Investigating",
    "awaiting_customer": "Awaiting Customer",
    "awaiting_partner": "Awaiting Partner",
    "resolved": "Resolved",
    "rejected": "Rejected",
    "escalated": "Escalated",
    "closed": "Closed",
}

PRIORITY_LABELS: dict[str, str] = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "critical": "Critical",
}


class DisputeSlaFields(BaseModel):
    sla_hours: int
    sla_deadline_at: datetime
    sla_status: str
    sla_status_label: str
    time_remaining_seconds: int
    overdue_seconds: int
    escalation_countdown_seconds: int
    is_breached: bool
    is_at_risk: bool


class DisputeAdminRowResponse(DisputeSlaFields):
    id: UUID
    order_id: UUID | None
    tracking_code: str | None
    customer_id: UUID
    customer_name: str
    customer_email: str | None
    customer_phone: str | None
    laundry_id: UUID | None
    laundry_name: str | None
    laundry_city: str | None
    partner_name: str | None
    complaint_type: ComplaintType
    type_label: str
    priority: DisputePriority
    priority_label: str
    status: ComplaintStatus
    status_label: str
    description: str
    created_at: datetime
    updated_at: datetime
    assigned_to_user_id: UUID | None
    assigned_to_name: str | None
    assigned_to_email: str | None = None
    assigned_to_role: str | None = None
    assigned_at: datetime | None = None
    photo_count: int
    resolved_at: datetime | None


class DisputeAdminTableResponse(BaseModel):
    items: list[DisputeAdminRowResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DisputeAdminMetricsResponse(BaseModel):
    open_disputes: int
    critical_disputes: int
    resolved_today: int
    pending_investigation: int
    unassigned_disputes: int
    my_open_disputes: int
    near_sla_breach: int
    breached_sla: int
    dispute_rate_pct: str
    avg_resolution_hours: str


class DisputeAssigneeResponse(BaseModel):
    id: UUID
    full_name: str
    email: str | None
    role: str
    role_label: str


class DisputeInternalNoteResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    author_user_id: UUID | None
    author_name: str | None
    body: str
    is_edited: bool
    created_at: datetime
    updated_at: datetime


class DisputeAdminDetailResponse(ComplaintDetailResponse, DisputeSlaFields):
    priority: DisputePriority
    priority_label: str
    assigned_to_user_id: UUID | None
    assigned_to_name: str | None
    assigned_at: datetime | None = None
    updated_at: datetime
    resolved_at: datetime | None
    customer_email: str | None = None
    customer_phone: str | None = None
    laundry_name: str | None = None
    partner_name: str | None = None
    fraud_risk: DisputeFraudRiskContext
    internal_notes: list[DisputeInternalNoteResponse] = Field(default_factory=list)


class DisputeBulkActionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    complaint_ids: list[UUID] = Field(min_length=1, max_length=100)
    action: str = Field(pattern="^(assign|status|escalate|close|note)$")
    assigned_to_user_id: UUID | None = None
    status: ComplaintStatus | None = None
    priority: DisputePriority | None = None
    note: str | None = Field(default=None, max_length=2000)


class DisputeInternalNoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=5000)


class DisputeInternalNoteUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=5000)


class DisputeAssignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assigned_to_user_id: UUID | None = None


class DisputePriorityUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    priority: DisputePriority
