"""Announcement API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnnouncementCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10000)
    target_type: str
    target_laundry_ids: list[UUID] = Field(default_factory=list)
    target_cities: list[str] = Field(default_factory=list)
    channel_in_app: bool = True
    channel_email: bool = False
    channel_push: bool = False
    action_url: str | None = Field(default=None, max_length=500)
    requires_acknowledgement: bool = False
    scheduled_at: datetime | None = None

    @model_validator(mode="after")
    def validate_target(self) -> AnnouncementCreateRequest:
        if self.target_type == "specific_laundries" and not self.target_laundry_ids:
            raise ValueError("target_laundry_ids required for specific_laundries")
        if self.target_type == "specific_cities" and not self.target_cities:
            raise ValueError("target_cities required for specific_cities")
        if not (self.channel_in_app or self.channel_email or self.channel_push):
            raise ValueError("At least one channel must be enabled")
        return self


class AnnouncementUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1, max_length=10000)
    target_type: str | None = None
    target_laundry_ids: list[UUID] | None = None
    target_cities: list[str] | None = None
    channel_in_app: bool | None = None
    channel_email: bool | None = None
    channel_push: bool | None = None
    action_url: str | None = Field(default=None, max_length=500)
    requires_acknowledgement: bool | None = None
    scheduled_at: datetime | None = None


class AnnouncementScheduleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scheduled_at: datetime


class AnnouncementRow(BaseModel):
    id: UUID
    title: str
    body: str
    status: str
    target_type: str
    target_laundry_ids: list[UUID]
    target_cities: list[str]
    channel_in_app: bool
    channel_email: bool
    channel_push: bool
    action_url: str | None
    requires_acknowledgement: bool
    scheduled_at: datetime | None
    published_at: datetime | None
    archived_at: datetime | None
    view_count: int
    click_count: int
    acknowledgement_count: int
    created_at: datetime
    updated_at: datetime


class AnnouncementListResponse(BaseModel):
    items: list[AnnouncementRow]
    total: int
    limit: int
    offset: int


class ActiveAnnouncementRow(BaseModel):
    id: UUID
    title: str
    body: str
    action_url: str | None
    requires_acknowledgement: bool
    published_at: datetime | None
    viewed: bool = False
    acknowledged: bool = False


class AnnouncementEventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event_type: str = Field(description="view | click | acknowledge")
