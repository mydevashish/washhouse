"""Partner review management API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.exceptions import AuthorizationError
from app.models.enums import UserRole
from app.schemas.review_management import (
    ReviewAbuseReportRequest,
    ReviewAnalyticsResponse,
    ReviewManagementRow,
    ReviewReplyRequest,
)
from app.services.review_management_service import ReviewManagementService

router = APIRouter(prefix="/partner/review-management", tags=["partner-review-management"])


async def get_review_actor(payload: Annotated[dict, Depends(get_current_user_payload)]) -> dict:
    if payload.get("role") not in (
        UserRole.partner.value,
        UserRole.partner_staff.value,
        UserRole.admin.value,
        UserRole.super_admin.value,
    ):
        raise AuthorizationError()
    return payload


@router.get("/reviews")
async def partner_list_reviews(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_review_actor)],
    rating: int | None = None,
    min_rating: int | None = None,
    max_rating: int | None = None,
    has_reply: bool | None = None,
    abuse_reported: bool | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows = await ReviewManagementService(session).partner_list_reviews(
        UUID(payload["sub"]),
        payload["role"],
        rating=rating,
        min_rating=min_rating,
        max_rating=max_rating,
        has_reply=has_reply,
        abuse_reported=abuse_reported,
        limit=limit,
        offset=offset,
    )
    return success_envelope([ReviewManagementRow.model_validate(r) for r in rows], request)


@router.get("/analytics")
async def partner_review_analytics(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_review_actor)],
) -> dict:
    data = await ReviewManagementService(session).partner_analytics(UUID(payload["sub"]), payload["role"])
    return success_envelope(ReviewAnalyticsResponse.model_validate(data), request)


@router.post("/reviews/{review_id}/reply")
async def partner_reply_to_review(
    review_id: UUID,
    body: ReviewReplyRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_review_actor)],
) -> dict:
    data = await ReviewManagementService(session).partner_reply(
        UUID(payload["sub"]),
        payload["role"],
        review_id,
        reply=body.reply,
    )
    return success_envelope(ReviewManagementRow.model_validate(data), request)


@router.post("/reviews/{review_id}/report-abuse")
async def partner_report_review_abuse(
    review_id: UUID,
    body: ReviewAbuseReportRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_review_actor)],
) -> dict:
    data = await ReviewManagementService(session).partner_report_abuse(
        UUID(payload["sub"]),
        payload["role"],
        review_id,
        reason=body.reason,
    )
    return success_envelope(ReviewManagementRow.model_validate(data), request)
