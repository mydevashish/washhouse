"""Delivery OTP API schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DeliveryOtpStatus


class DeliveryOtpVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class DeliveryVerificationStatusResponse(BaseModel):
    order_id: UUID
    status: DeliveryOtpStatus
    generated_at: datetime | None = None
    expires_at: datetime | None = None
    verified_at: datetime | None = None
    delivery_agent_user_id: UUID | None = None
    verification_latitude: Decimal | None = None
    verification_longitude: Decimal | None = None
    failed_attempts: int = 0
    is_verified: bool = False
    otp_available: bool = False


class CustomerDeliveryOtpResponse(BaseModel):
    order_id: UUID
    otp_code: str
    expires_at: datetime
    status: DeliveryOtpStatus


class DeliveryVerifyCompleteResponse(BaseModel):
    order_id: UUID
    status: str
    verified_at: datetime
    delivery_agent_user_id: UUID
