"""Chain-of-custody API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import CustodyActorRole, CustodyEventType


CUSTODY_EVENT_LABELS: dict[CustodyEventType, str] = {
    CustodyEventType.order_confirmed: "Order Confirmed",
    CustodyEventType.pickup_assigned: "Pickup Assigned",
    CustodyEventType.pickup_photos_uploaded: "Pickup Photos Uploaded",
    CustodyEventType.inventory_recorded: "Inventory Recorded",
    CustodyEventType.inventory_confirmed: "Inventory Confirmed",
    CustodyEventType.pickup_completed: "Pickup Completed",
    CustodyEventType.washing_started: "Washing Started",
    CustodyEventType.ironing_started: "Ironing Started",
    CustodyEventType.packaging_completed: "Packaging Completed",
    CustodyEventType.delivery_assigned: "Delivery Assigned",
    CustodyEventType.delivery_proof_uploaded: "Delivery Proof Uploaded",
    CustodyEventType.otp_verified: "OTP Verified",
    CustodyEventType.delivered: "Delivered",
    CustodyEventType.order_cancelled: "Order Cancelled",
}


class CustodyEventResponse(BaseModel):
    id: UUID
    order_id: UUID
    event_type: CustodyEventType
    label: str
    actor_user_id: UUID | None
    actor_role: CustodyActorRole
    actor_name: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustodyTimelineResponse(BaseModel):
    order_id: UUID
    events: list[CustodyEventResponse]
