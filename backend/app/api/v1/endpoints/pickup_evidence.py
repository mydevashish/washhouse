"""Pickup evidence upload and viewing APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner, get_current_user_payload
from app.core.exceptions import ValidationError
from app.schemas.pickup_evidence import PickupEvidencePhotoResponse, PickupEvidenceUploadResponse
from app.services.pickup_evidence_service import PickupEvidenceService

router = APIRouter(tags=["pickup-evidence"])

MAX_FILES = 10


def _photo_response(photo) -> PickupEvidencePhotoResponse:
    svc = PickupEvidenceService
    return PickupEvidencePhotoResponse(
        id=photo.id,
        order_id=photo.order_id,
        customer_id=photo.customer_id,
        laundry_id=photo.laundry_id,
        captured_at=photo.captured_at,
        latitude=photo.latitude,
        longitude=photo.longitude,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        sort_index=photo.sort_index,
        created_at=photo.created_at,
        original_url=svc.media_url(photo.id, variant="original"),
        compressed_url=svc.media_url(photo.id, variant="compressed"),
    )


@router.post("/partner/orders/{order_id}/pickup-evidence", status_code=201)
async def upload_pickup_evidence(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    files: list[UploadFile] = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    captured_at: datetime | None = Form(default=None),
) -> dict:
    if not files:
        raise ValidationError("At least one photo is required")
    if len(files) > MAX_FILES:
        raise ValidationError(f"Maximum {MAX_FILES} photos allowed")

    prepared: list[tuple[bytes, str | None]] = []
    for upload in files:
        raw = await upload.read()
        prepared.append((raw, upload.content_type))

    photos = await PickupEvidenceService(session).upload_for_partner(
        UUID(payload["sub"]),
        order_id,
        files=prepared,
        captured_at=captured_at,
        latitude=latitude,
        longitude=longitude,
    )
    body = PickupEvidenceUploadResponse(
        photos=[_photo_response(p) for p in photos],
        count=len(photos),
    )
    return success_envelope(body, request)


@router.get("/partner/orders/{order_id}/pickup-evidence")
async def list_partner_pickup_evidence(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    photos = await PickupEvidenceService(session).list_for_partner(UUID(payload["sub"]), order_id)
    data = [_photo_response(p) for p in photos]
    return success_envelope(data, request)


@router.get("/orders/{order_id}/pickup-evidence")
async def list_customer_pickup_evidence(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    photos = await PickupEvidenceService(session).list_for_customer(UUID(payload["sub"]), order_id)
    data = [_photo_response(p) for p in photos]
    return success_envelope(data, request)


@router.get("/admin/orders/{order_id}/pickup-evidence")
async def list_admin_pickup_evidence(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    photos = await PickupEvidenceService(session).list_for_admin(order_id)
    data = [_photo_response(p) for p in photos]
    return success_envelope(data, request)


@router.get("/pickup-evidence/photos/{photo_id}/compressed")
async def get_compressed_photo(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await PickupEvidenceService(session).get_photo_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
    )
    return FileResponse(path, media_type=content_type, filename=path.name)


@router.get("/pickup-evidence/photos/{photo_id}/original")
async def get_original_photo(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await PickupEvidenceService(session).get_photo_original_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
    )
    return FileResponse(path, media_type=content_type, filename=path.name)
