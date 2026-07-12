"""Shared API response envelopes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int
    has_next: bool = False
    has_previous: bool = False


class PaginatedListResponse(BaseModel, Generic[T]):
    """Standard platform list response — all list endpoints should use this shape."""

    items: list[T]
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool
    has_previous: bool

    @classmethod
    def from_dict(cls, payload: dict) -> PaginatedListResponse:
        return cls.model_validate(payload)

    @classmethod
    def empty(cls, *, page: int = 1, page_size: int = 10) -> PaginatedListResponse:
        return cls(
            items=[],
            page=page,
            page_size=page_size,
            total_records=0,
            total_pages=1,
            has_next=False,
            has_previous=False,
        )


class ResponseMeta(BaseModel):
    request_id: str = ""
    timestamp: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
    )
    pagination: PaginationMeta | None = None


class Envelope(BaseModel, Generic[T]):
    data: T
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
