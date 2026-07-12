"""Dispute management API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ComplaintStatus, ComplaintType, CustodyActorRole
from app.schemas.custody_event import CustodyTimelineResponse
from app.schemas.delivery_otp import DeliveryVerificationStatusResponse
from app.schemas.delivery_proof import DeliveryProofPhotoResponse
from app.schemas.inventory_verification import InventoryVerificationResponse
from app.schemas.pickup_evidence import PickupEvidencePhotoResponse

DISPUTE_TYPE_LABELS: dict[str, str] = {
    ComplaintType.missing_item.value: "Missing Item",
    ComplaintType.damaged_item.value: "Damaged Item",
    ComplaintType.wrong_item.value: "Wrong Item",
    ComplaintType.late_delivery.value: "Late Delivery",
    ComplaintType.quality_issue.value: "Quality Issue",
    ComplaintType.missing_items.value: "Missing Item",
    ComplaintType.damaged_items.value: "Damaged Item",
    ComplaintType.delayed_delivery.value: "Late Delivery",
    ComplaintType.refund_request.value: "Refund Request",
    ComplaintType.payment_issue.value: "Payment Issue",
    ComplaintType.other.value: "Other",
}

DISPUTE_STATUS_LABELS: dict[str, str] = {
    ComplaintStatus.open.value: "Open",
    ComplaintStatus.investigating.value: "Investigating",
    ComplaintStatus.awaiting_customer.value: "Awaiting Customer",
    ComplaintStatus.awaiting_partner.value: "Awaiting Partner",
    ComplaintStatus.resolved.value: "Resolved",
    ComplaintStatus.rejected.value: "Rejected",
    ComplaintStatus.escalated.value: "Escalated",
    ComplaintStatus.closed.value: "Closed",
}


class ComplaintPhotoResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    sort_index: int
    created_at: datetime
    original_url: str
    compressed_url: str


class ComplaintStatusEventResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    status: ComplaintStatus
    status_label: str
    actor_user_id: UUID | None
    actor_role: CustodyActorRole
    actor_name: str | None = None
    note: str | None
    created_at: datetime


class ComplaintListItemResponse(BaseModel):
    id: UUID
    order_id: UUID | None
    complaint_type: ComplaintType
    type_label: str
    description: str
    status: ComplaintStatus
    status_label: str
    created_at: datetime
    tracking_code: str | None = None
    customer_name: str | None = None
    photo_count: int = 0


class ComplaintDetailResponse(BaseModel):
    id: UUID
    order_id: UUID | None
    complaint_type: ComplaintType
    type_label: str
    description: str
    status: ComplaintStatus
    status_label: str
    created_at: datetime
    tracking_code: str | None = None
    admin_notes: str | None = None
    photos: list[ComplaintPhotoResponse] = Field(default_factory=list)
    status_events: list[ComplaintStatusEventResponse] = Field(default_factory=list)
    inventory_verification: InventoryVerificationResponse | None = None
    inventory_history_count: int = 0
    pickup_evidence: list[PickupEvidencePhotoResponse] = Field(default_factory=list)
    delivery_proof: DeliveryProofPhotoResponse | None = None
    delivery_verification: DeliveryVerificationStatusResponse | None = None
    custody_timeline: CustodyTimelineResponse | None = None


class ComplaintStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ComplaintStatus
    admin_notes: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
