"""Platform configuration API schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class CommissionDefaultUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rate: Decimal = Field(ge=0, le=100)


class LaundryCommissionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rate: Decimal | None = Field(default=None, ge=0, le=100)


class PartnerCommissionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: UUID | None = None
    email: EmailStr | None = None
    rate: Decimal = Field(ge=0, le=100)

    @model_validator(mode="after")
    def require_identifier(self) -> PartnerCommissionUpdate:
        if not self.user_id and not self.email:
            raise ValueError("user_id or email is required")
        return self


class OrderSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    min_amount_inr: Decimal = Field(ge=0)
    max_amount_inr: Decimal = Field(gt=0)
    pickup_radius_km: Decimal = Field(gt=0, le=50)
    delivery_radius_km: Decimal = Field(gt=0, le=50)


class DisputeSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dispute_window_hours: int = Field(ge=1, le=720)
    refund_window_hours: int = Field(ge=1, le=720)
    sla_hours: dict[str, int]


class SessionSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    idle_timeout_minutes: int = Field(ge=5, le=480)
    warning_timeout_minutes: int = Field(ge=1, le=60)


class NotificationSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    in_app_enabled: bool


class PlatformConfigResponse(BaseModel):
    commission: dict
    order: dict
    dispute: dict
    session: dict
    notification: dict


class ConfigAuditRow(BaseModel):
    id: str
    timestamp: str
    user_name: str
    user_email: str | None
    category: str | None = None
    key: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    action: str
