"""API response helpers."""

from __future__ import annotations

from fastapi import Request

from app.schemas.common import Envelope, PaginationMeta, ResponseMeta


def success_envelope(
    data: object,
    request: Request,
    *,
    pagination: PaginationMeta | None = None,
) -> dict:
    return Envelope(
        data=data,
        meta=ResponseMeta(
            request_id=request.headers.get("X-Request-ID", ""),
            pagination=pagination,
        ),
    ).model_dump()


def pagination_meta(*, total: int, limit: int, offset: int) -> PaginationMeta:
    page = (offset // limit) + 1 if limit > 0 else 1
    total_pages = max(1, (total + limit - 1) // limit) if limit > 0 else 1
    return PaginationMeta(
        page=page,
        per_page=limit,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )


def paginated_envelope(data: dict, request: Request) -> dict:
    """Wrap standard paginated list body in success envelope."""
    return success_envelope(data, request)
