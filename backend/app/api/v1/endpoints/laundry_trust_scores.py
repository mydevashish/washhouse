"""Admin laundry trust score APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.services.laundry_trust_score_service import LaundryTrustScoreService

router = APIRouter(prefix="/admin/laundry-trust-scores", tags=["laundry-trust-scores"])


@router.get("")
async def list_laundry_trust_scores(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await LaundryTrustScoreService(session).list_for_admin()
    return success_envelope(data, request)


@router.get("/{laundry_id}")
async def get_laundry_trust_score_detail(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await LaundryTrustScoreService(session).get_detail_for_admin(laundry_id)
    return success_envelope(data, request)
