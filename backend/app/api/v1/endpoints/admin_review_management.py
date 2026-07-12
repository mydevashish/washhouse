"""Admin review moderation API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
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
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows = await ReviewManagementService(session).admin_list_reviews(
        laundry_id=laundry_id,
        status=status,
        abuse_reported=abuse_reported,
        is_fake=is_fake,
        limit=limit,
        offset=offset,
    )
    return success_envelope([ReviewManagementRow.model_validate(r) for r in rows], request)


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
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    rows = await ReviewManagementService(session).admin_audit_log(review_id=review_id, limit=limit)
    return success_envelope([ReviewAuditRow.model_validate(r) for r in rows], request)
