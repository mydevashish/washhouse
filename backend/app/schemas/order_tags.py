"""Partner order tag / print-context schemas."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ColorToken


class TagKind(str, Enum):
    bag_master = "bag_master"
    item = "item"


class OrderTagLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: TagKind
    label: str
    service_name: str | None = None
    quantity: int = 1
    qty_index: str | None = None
    piece_index: int | None = None
    piece_total: int | None = None


class OrderTagsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_id: UUID
    laundry_id: UUID
    laundry_name: str
    color_token: ColorToken
    token_code: str
    token_day_number: int
    token_assigned_on: date
    customer_name: str
    customer_phone: str
    customer_phone_last4: str
    tracking_code: str
    piece_count: int
    line_count: int
    created_at: datetime
    per_piece: bool = False
    tags: list[OrderTagLine] = Field(default_factory=list)
