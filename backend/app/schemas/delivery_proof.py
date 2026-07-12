"""Delivery proof API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DeliveryProofPhotoResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    laundry_id: UUID
    captured_at: datetime
    latitude: Decimal | None
    longitude: Decimal | None
    uploaded_by_user_id: UUID
    uploaded_by_name: str | None = None
    device_info: dict[str, Any] | None
    created_at: datetime
    original_url: str
    compressed_url: str


class DeliveryProofUploadResponse(BaseModel):
    photo: DeliveryProofPhotoResponse


class DeliveryProofDeviceInfo(BaseModel):
    model_config = ConfigDict(extra="allow")

    user_agent: str | None = Field(default=None, max_length=2000)
    platform: str | None = Field(default=None, max_length=120)
    language: str | None = Field(default=None, max_length=40)
    screen: str | None = Field(default=None, max_length=40)
    timezone: str | None = Field(default=None, max_length=80)
