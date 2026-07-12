"""Inventory verification API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    INVENTORY_ITEM_TYPES,
    InventoryChangeRequestStatus,
    InventoryHistoryAction,
    InventoryItemType,
    InventoryVerificationStatus,
)


class InventoryItemsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shirts: int = Field(default=0, ge=0, le=500)
    trousers: int = Field(default=0, ge=0, le=500)
    sarees: int = Field(default=0, ge=0, le=500)
    jackets: int = Field(default=0, ge=0, le=500)
    bedsheets: int = Field(default=0, ge=0, le=500)
    blankets: int = Field(default=0, ge=0, le=500)
    curtains: int = Field(default=0, ge=0, le=500)
    other: int = Field(default=0, ge=0, le=500)


class InventoryItemLineResponse(BaseModel):
    item_type: InventoryItemType
    label: str
    quantity: int


class InventoryVerificationResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    laundry_id: UUID
    status: InventoryVerificationStatus
    items: list[InventoryItemLineResponse]
    total_quantity: int
    recorded_by_user_id: UUID
    recorded_at: datetime
    confirmed_by_user_id: UUID | None
    confirmed_at: datetime | None
    locked_at: datetime | None
    is_locked: bool
    pending_change_request_id: UUID | None = None


class InventoryRecordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: InventoryItemsInput
    note: str | None = Field(default=None, max_length=1000)


class InventoryChangeRequestInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: InventoryItemsInput
    reason: str = Field(min_length=10, max_length=2000)


class InventoryHistoryEntryResponse(BaseModel):
    id: UUID
    order_id: UUID
    verification_id: UUID
    action: InventoryHistoryAction
    items_snapshot: dict
    actor_user_id: UUID
    note: str | None
    created_at: datetime


class InventoryChangeRequestResponse(BaseModel):
    id: UUID
    order_id: UUID
    verification_id: UUID
    proposed_items: dict
    reason: str
    status: InventoryChangeRequestStatus
    requested_by_user_id: UUID
    reviewed_by_user_id: UUID | None
    reviewed_at: datetime | None
    admin_notes: str | None
    created_at: datetime


class InventoryChangeReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    admin_notes: str | None = Field(default=None, max_length=2000)


ITEM_LABELS: dict[InventoryItemType, str] = {
    InventoryItemType.shirts: "Shirts",
    InventoryItemType.trousers: "Trousers",
    InventoryItemType.sarees: "Sarees",
    InventoryItemType.jackets: "Jackets",
    InventoryItemType.bedsheets: "Bedsheets",
    InventoryItemType.blankets: "Blankets",
    InventoryItemType.curtains: "Curtains",
    InventoryItemType.other: "Other Items",
}


def items_input_to_dict(items: InventoryItemsInput) -> dict[str, int]:
    return {t.value: int(getattr(items, t.value)) for t in INVENTORY_ITEM_TYPES}


def empty_items_dict() -> dict[str, int]:
    return {t.value: 0 for t in INVENTORY_ITEM_TYPES}
