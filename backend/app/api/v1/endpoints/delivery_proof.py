"""Delivery proof upload and viewing APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner, get_current_user_payload
from app.core.exceptions import ValidationError
from app.schemas.delivery_proof import DeliveryProofPhotoResponse, DeliveryProofUploadResponse
from app.services.delivery_proof_service import DeliveryProofService

router = APIRouter(tags=["delivery-proof"])


def _photo_response(photo) -> DeliveryProofPhotoResponse:
    svc = DeliveryProofService
    return DeliveryProofPhotoResponse(
        id=photo.id,
        order_id=photo.order_id,
        customer_id=photo.customer_id,
        laundry_id=photo.laundry_id,
        captured_at=photo.captured_at,
        latitude=photo.latitude,
        longitude=photo.longitude,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        device_info=photo.device_info,
        created_at=photo.created_at,
        original_url=svc.media_url(photo.id, variant="original"),
        compressed_url=svc.media_url(photo.id, variant="compressed"),
    )


@router.post("/partner/orders/{order_id}/delivery-proof", status_code=201)
async def upload_delivery_proof(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    file: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    captured_at: datetime | None = Form(default=None),
    device_info: str | None = Form(default=None),
) -> dict:
    raw = await file.read()
    if not raw:
        raise ValidationError("Delivery photo is required")

    photo = await DeliveryProofService(session).upload_for_partner(
        UUID(payload["sub"]),
        order_id,
        raw=raw,
        content_type=file.content_type,
        captured_at=captured_at,
        latitude=latitude,
        longitude=longitude,
        device_info=DeliveryProofService.parse_device_info(device_info),
    )
    body = DeliveryProofUploadResponse(photo=_photo_response(photo))
    return success_envelope(body, request)


@router.get("/partner/orders/{order_id}/delivery-proof")
async def get_partner_delivery_proof(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    photo = await DeliveryProofService(session).get_for_partner(UUID(payload["sub"]), order_id)
    data = _photo_response(photo) if photo else None
    return success_envelope(data, request)


@router.get("/orders/{order_id}/delivery-proof")
async def get_customer_delivery_proof(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    photo = await DeliveryProofService(session).get_for_customer(UUID(payload["sub"]), order_id)
    data = _photo_response(photo) if photo else None
    return success_envelope(data, request)


@router.get("/admin/orders/{order_id}/delivery-proof")
async def get_admin_delivery_proof(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    photo = await DeliveryProofService(session).get_for_admin(order_id)
    data = _photo_response(photo) if photo else None
    return success_envelope(data, request)


@router.get("/delivery-proof/photos/{photo_id}/compressed")
async def get_compressed_delivery_photo(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await DeliveryProofService(session).get_photo_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
    )
    return FileResponse(path, media_type=content_type, filename=path.name)


@router.get("/delivery-proof/photos/{photo_id}/original")
async def get_original_delivery_photo(
    photo_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> FileResponse:
    _, path, content_type = await DeliveryProofService(session).get_photo_for_viewer(
        photo_id,
        user_id=UUID(payload["sub"]),
        role=str(payload.get("role", "")),
        variant="original",
    )
    return FileResponse(path, media_type=content_type, filename=path.name)
