"""Pickup evidence API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PickupEvidencePhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    customer_id: UUID
    laundry_id: UUID
    captured_at: datetime
    latitude: Decimal | None
    longitude: Decimal | None
    uploaded_by_user_id: UUID
    uploaded_by_name: str | None = None
    sort_index: int
    created_at: datetime
    original_url: str
    compressed_url: str


class PickupEvidenceUploadResponse(BaseModel):
    photos: list[PickupEvidencePhotoResponse]
    count: int = Field(ge=1, le=10)
