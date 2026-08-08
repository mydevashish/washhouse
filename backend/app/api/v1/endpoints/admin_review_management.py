"""Admin review moderation API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.core.pagination import DEFAULT_PAGE_SIZE, build_paginated_response
from app.schemas.common import PaginatedListResponse
from app.schemas.review_management import ReviewAuditRow, ReviewManagementRow, ReviewModerateRequest
from app.services.review_management_service import ReviewManagementService

router = APIRouter(prefix="/admin/review-management", tags=["admin-review-management"])


@router.get("/dashboard")
async def admin_review_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ReviewManagementService(session).admin_dashboard()
    return success_envelope(data, request)


@router.get("/reviews")
async def admin_list_reviews(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    laundry_id: UUID | None = None,
    status: str | None = None,
    abuse_reported: bool | None = None,
    is_fake: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
) -> dict:
    data = await ReviewManagementService(session).admin_list_reviews(
        laundry_id=laundry_id,
        status=status,
        abuse_reported=abuse_reported,
        is_fake=is_fake,
        page=page,
        page_size=page_size,
    )
    return success_envelope(
        PaginatedListResponse[ReviewManagementRow].model_validate(
            build_paginated_response(
                items=[ReviewManagementRow.model_validate(r) for r in data["items"]],
                total_records=data["total_records"],
                page=data["page"],
                page_size=data["page_size"],
            ),
        ),
        request,
    )


@router.patch("/reviews/{review_id}/moderate")
async def admin_moderate_review(
    review_id: UUID,
    body: ReviewModerateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ReviewManagementService(session).admin_moderate(
        UUID(payload["sub"]),
        review_id,
        action=body.action,
        note=body.note,
    )
    return success_envelope(ReviewManagementRow.model_validate(data), request)


@router.get("/audit")
async def admin_review_audit(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    review_id: UUID | None = None,
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=200),
) -> dict:
    rows = await ReviewManagementService(session).admin_audit_log(review_id=review_id, limit=limit)
    return success_envelope([ReviewAuditRow.model_validate(r) for r in rows], request)
