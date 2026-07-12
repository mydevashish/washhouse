"""Review API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    laundry_id: UUID
    user_id: UUID
    order_id: UUID
    rating: int
    comment: str | None
    partner_reply: str | None = None
    partner_replied_at: datetime | None = None
    created_at: datetime
