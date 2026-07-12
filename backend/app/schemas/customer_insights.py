"""Partner customer insights schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CustomerSegmentCounts(BaseModel):
    new: int = 0
    active: int = 0
    vip: int = 0
    at_risk: int = 0
    inactive: int = 0


class CustomerListCounts(BaseModel):
    top: int = 0
    repeat: int = 0
    vip: int = 0
    inactive: int = 0
    high_risk: int = 0


class CustomerInsightsDashboard(BaseModel):
    total_customers: int
    segments: CustomerSegmentCounts
    lists: CustomerListCounts
    avg_retention_score: str
    avg_lifetime_spend_inr: str
    avg_order_value_inr: str


class CustomerInsightRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    name: str
    lifetime_spend_inr: str
    order_count: int
    avg_order_value_inr: str
    last_order_at: datetime | None
    first_order_at: datetime | None
    retention_score: int = Field(ge=0, le=100)
    segment: str
    segment_label: str
    is_high_risk: bool
    dispute_count: int
    risk_label: str


class CustomerInsightsListResponse(BaseModel):
    items: list[CustomerInsightRow]
    total: int
    limit: int
    offset: int
