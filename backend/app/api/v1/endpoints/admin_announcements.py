"""Admin announcement center API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.announcement import (
    AnnouncementCreateRequest,
    AnnouncementListResponse,
    AnnouncementRow,
    AnnouncementScheduleRequest,
    AnnouncementUpdateRequest,
)
from app.services.announcement_service import AnnouncementService

router = APIRouter(prefix="/admin/announcements", tags=["admin-announcements"])


@router.get("")
async def list_announcements(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    data = await AnnouncementService(session).admin_list(status=status, limit=limit, offset=offset)
    return success_envelope(
        AnnouncementListResponse(
            items=[AnnouncementRow.model_validate(i) for i in data["items"]],
            total=data["total"],
            limit=data["limit"],
            offset=data["offset"],
        ),
        request,
    )


@router.get("/{announcement_id}")
async def get_announcement(
    announcement_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_get(announcement_id)
    return success_envelope(AnnouncementRow.model_validate(data), request)


@router.post("")
async def create_announcement(
    body: AnnouncementCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_create(UUID(payload["sub"]), body.model_dump())
    return success_envelope(AnnouncementRow.model_validate(data), request)


@router.patch("/{announcement_id}")
async def update_announcement(
    announcement_id: UUID,
    body: AnnouncementUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_update(
        UUID(payload["sub"]),
        announcement_id,
        body.model_dump(exclude_unset=True),
    )
    return success_envelope(AnnouncementRow.model_validate(data), request)


@router.post("/{announcement_id}/publish")
async def publish_announcement(
    announcement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_publish(UUID(payload["sub"]), announcement_id)
    return success_envelope(AnnouncementRow.model_validate(data), request)


@router.post("/{announcement_id}/schedule")
async def schedule_announcement(
    announcement_id: UUID,
    body: AnnouncementScheduleRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_schedule(
        UUID(payload["sub"]),
        announcement_id,
        body.scheduled_at,
    )
    return success_envelope(AnnouncementRow.model_validate(data), request)


@router.post("/{announcement_id}/archive")
async def archive_announcement(
    announcement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AnnouncementService(session).admin_archive(UUID(payload["sub"]), announcement_id)
    return success_envelope(AnnouncementRow.model_validate(data), request)
