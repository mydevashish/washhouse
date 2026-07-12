"""User-facing announcements API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.schemas.announcement import ActiveAnnouncementRow, AnnouncementEventRequest
from app.services.announcement_service import AnnouncementService

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/active")
async def list_active_announcements(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    rows = await AnnouncementService(session).user_active(UUID(payload["sub"]))
    return success_envelope([ActiveAnnouncementRow.model_validate(r) for r in rows], request)


@router.post("/{announcement_id}/events")
async def record_announcement_event(
    announcement_id: UUID,
    body: AnnouncementEventRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await AnnouncementService(session).record_event(
        UUID(payload["sub"]),
        announcement_id,
        body.event_type,
    )
    return success_envelope(data, request)
