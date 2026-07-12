"""Enterprise staff management API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import PartnerStaffRole


class WorkSchedule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    days: list[str] = Field(default_factory=lambda: ["mon", "tue", "wed", "thu", "fri", "sat"])
    start_time: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="18:00", pattern=r"^\d{2}:\d{2}$")
    timezone: str = Field(default="Asia/Kolkata", max_length=64)


class StaffDashboardResponse(BaseModel):
    laundry_id: UUID
    laundry_name: str
    total_staff: int
    active_staff: int
    online_staff: int
    inactive_staff: int
    suspended_staff: int = 0
    pending_tasks: int
    pending_pickups: int
    pending_deliveries: int
    pending_processing: int


class StaffMemberResponse(BaseModel):
    id: UUID
    laundry_id: UUID
    laundry_name: str
    user_id: UUID | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    role: str
    role_label: str
    is_active: bool
    is_suspended: bool = False
    suspended_reason: str | None = None
    work_schedule: WorkSchedule | None = None
    last_login_at: datetime | None = None
    last_active_at: datetime | None = None
    created_at: datetime
    temporary_password: str | None = None


class StaffCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    role: PartnerStaffRole
    laundry_id: UUID | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    work_schedule: WorkSchedule | None = None


class StaffUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    role: PartnerStaffRole | None = None
    laundry_id: UUID | None = None
    work_schedule: WorkSchedule | None = None


class StaffSuspendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=3, max_length=500)


class StaffResetPasswordResponse(BaseModel):
    staff_id: UUID
    temporary_password: str


class StaffActivityRow(BaseModel):
    id: UUID
    staff_id: UUID | None = None
    staff_name: str
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    description: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime
