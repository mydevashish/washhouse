"""Protected dispute photo delivery."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.api.v1.deps import SessionDep, get_current_user_payload
from app.services.complaint_service import ComplaintService

router = APIRouter(tags=["complaints"])


@router.get("/complaint-photos/{photo_id}/compressed")
async def get_complaint_photo_compressed(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await ComplaintService(session).get_photo_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
    )
    return FileResponse(path, media_type=content_type, filename=path.name)


@router.get("/complaint-photos/{photo_id}/original")
async def get_complaint_photo_original(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await ComplaintService(session).get_photo_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
        variant="original",
    )
    return FileResponse(path, media_type=content_type, filename=path.name)
