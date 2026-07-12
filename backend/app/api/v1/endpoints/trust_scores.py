"""Admin customer trust score APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.trust_score_list_params import TrustScoreListQuery
from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.common import PaginatedListResponse
from app.schemas.trust_score import CustomerTrustScoreSummary
from app.services.trust_score_service import TrustScoreService

router = APIRouter(prefix="/admin/trust-scores", tags=["trust-scores"])


@router.get("")
async def list_customer_trust_scores(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    params: TrustScoreListQuery,
) -> dict:
    data = await TrustScoreService(session).list_for_admin(params)
    return success_envelope(
        PaginatedListResponse[CustomerTrustScoreSummary].model_validate(data),
        request,
    )


@router.get("/{user_id}")
async def get_customer_trust_score_detail(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await TrustScoreService(session).get_detail_for_admin(user_id)
    return success_envelope(data, request)
