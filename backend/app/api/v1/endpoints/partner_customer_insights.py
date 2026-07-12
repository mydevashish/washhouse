"""Partner customer insights API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.exceptions import AuthorizationError
from app.models.enums import UserRole
from app.schemas.customer_insights import (
    CustomerInsightRow,
    CustomerInsightsDashboard,
    CustomerInsightsListResponse,
)
from app.services.customer_insights_service import CustomerInsightsService

router = APIRouter(prefix="/partner/customer-insights", tags=["partner-customer-insights"])


async def get_insights_actor(payload: Annotated[dict, Depends(get_current_user_payload)]) -> dict:
    if payload.get("role") not in (
        UserRole.partner.value,
        UserRole.partner_staff.value,
        UserRole.admin.value,
        UserRole.super_admin.value,
    ):
        raise AuthorizationError()
    return payload


@router.get("/dashboard")
async def partner_customer_insights_dashboard(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_insights_actor)],
) -> dict:
    data = await CustomerInsightsService(session).partner_dashboard(UUID(payload["sub"]), payload["role"])
    return success_envelope(CustomerInsightsDashboard.model_validate(data), request)


@router.get("/customers")
async def partner_customer_insights_list(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_insights_actor)],
    list_type: str | None = Query(default=None, pattern="^(top|repeat|vip|inactive|high_risk)$"),
    segment: str | None = Query(default=None, pattern="^(new|active|vip|at_risk|inactive)$"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    data = await CustomerInsightsService(session).partner_list_customers(
        UUID(payload["sub"]),
        payload["role"],
        list_type=list_type,
        segment=segment,
        limit=limit,
        offset=offset,
    )
    return success_envelope(
        CustomerInsightsListResponse(
            items=[CustomerInsightRow.model_validate(i) for i in data["items"]],
            total=data["total"],
            limit=data["limit"],
            offset=data["offset"],
        ),
        request,
    )
