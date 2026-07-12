"""Chain-of-custody timeline APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner, get_current_user_payload
from app.services.custody_event_service import CustodyEventService

router = APIRouter(tags=["custody-timeline"])


@router.get("/orders/{order_id}/custody-timeline")
async def get_customer_custody_timeline(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await CustodyEventService(session).get_timeline_for_customer(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.get("/partner/orders/{order_id}/custody-timeline")
async def get_partner_custody_timeline(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await CustodyEventService(session).get_timeline_for_partner(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.get("/admin/orders/{order_id}/custody-timeline")
async def get_admin_custody_timeline(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await CustodyEventService(session).get_timeline_for_admin(order_id)
    return success_envelope(data, request)
