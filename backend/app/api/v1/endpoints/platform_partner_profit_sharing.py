"""Platform partner profit sharing read API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_platform_partner
from app.schemas.profit_sharing import PartnerProfitSharingSummary
from app.services.profit_sharing_service import ProfitSharingService

router = APIRouter(prefix="/platform-partner/profit-sharing", tags=["platform-partner-profit-sharing"])


@router.get("/summary")
async def partner_profit_sharing_summary(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_platform_partner)],
) -> dict:
    data = await ProfitSharingService(session).partner_summary(UUID(payload["sub"]))
    return success_envelope(PartnerProfitSharingSummary.model_validate(data), request)
