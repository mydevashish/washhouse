"""Platform partner read-only dashboard API."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_platform_partner
from app.schemas.platform_partner_dashboard import PlatformPartnerDashboardResponse
from app.services.platform_partner_dashboard_service import PlatformPartnerDashboardService

router = APIRouter(prefix="/platform-partner", tags=["platform-partner"])


@router.get("/dashboard")
async def platform_partner_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_platform_partner)],
) -> dict:
    data = await PlatformPartnerDashboardService(session).dashboard()
    return success_envelope(PlatformPartnerDashboardResponse.model_validate(data), request)
