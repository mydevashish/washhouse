"""User and address schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None
    phone: str | None
    full_name: str
    role: UserRole
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime
    updated_at: datetime


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=1, max_length=200)


class AddressCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(default="Home", max_length=80)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=5, max_length=10, pattern=r"^\d{6}$")
    latitude: float | None = None
    longitude: float | None = None
    is_default: bool = False
    notes: str | None = Field(default=None, max_length=500)


class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    line1: str
    line2: str | None
    city: str
    state: str
    pincode: str
    latitude: float | None
    longitude: float | None
    is_default: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime


class AddressUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str | None = Field(default=None, max_length=80)
    line1: str | None = Field(default=None, max_length=255)
    line2: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, pattern=r"^\d{6}$")
    latitude: float | None = None
    longitude: float | None = None
    is_default: bool | None = None
    notes: str | None = None
