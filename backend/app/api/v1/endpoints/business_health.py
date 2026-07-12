"""Executive business health dashboard API."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.business_health import BusinessHealthDashboardResponse
from app.services.business_health_service import BusinessHealthService

router = APIRouter(prefix="/admin/business-health", tags=["admin-business-health"])


@router.get("")
async def business_health_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await BusinessHealthService(session).dashboard()
    return success_envelope(BusinessHealthDashboardResponse.model_validate(data), request)
