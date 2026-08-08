"""Admin laundry trust score APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.core.pagination import DEFAULT_PAGE_SIZE, build_paginated_response
from app.schemas.common import PaginatedListResponse
from app.schemas.laundry_trust_score import LaundryTrustScoreSummary
from app.services.laundry_trust_score_service import LaundryTrustScoreService

router = APIRouter(prefix="/admin/laundry-trust-scores", tags=["laundry-trust-scores"])


@router.get("")
async def list_laundry_trust_scores(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = None,
) -> dict:
    data = await LaundryTrustScoreService(session).list_for_admin(
        page=page,
        page_size=page_size,
        search=search,
    )
    return success_envelope(
        PaginatedListResponse[LaundryTrustScoreSummary].model_validate(
            build_paginated_response(
                items=data["items"],
                total_records=data["total_records"],
                page=data["page"],
                page_size=data["page_size"],
            ),
        ),
        request,
    )


@router.get("/{laundry_id}")
async def get_laundry_trust_score_detail(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await LaundryTrustScoreService(session).get_detail_for_admin(laundry_id)
    return success_envelope(data, request)
