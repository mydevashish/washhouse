"""Review management schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReviewReplyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reply: str = Field(min_length=1, max_length=2000)


class ReviewAbuseReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=5, max_length=500)


class ReviewModerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: str = Field(description="hide | remove | restore | mark_fake")
    note: str | None = Field(default=None, max_length=500)


class ReviewManagementRow(BaseModel):
    id: UUID
    laundry_id: UUID
    laundry_name: str | None = None
    user_id: UUID
    customer_name: str
    order_id: UUID
    rating: int
    comment: str | None
    status: str
    partner_reply: str | None = None
    partner_replied_at: datetime | None = None
    abuse_reported: bool
    abuse_reason: str | None = None
    is_fake: bool
    moderation_note: str | None = None
    created_at: datetime


class ReviewAnalyticsResponse(BaseModel):
    avg_rating: str
    review_count: int
    positive_reviews: int
    negative_reviews: int
    rating_trend: list[dict]
    common_complaints: list[dict]
    common_praise: list[dict]


class ReviewAuditRow(BaseModel):
    id: str
    timestamp: str
    user_name: str
    action: str
    review_id: str
    old_value: str | None = None
    new_value: str | None = None
    note: str | None = None
