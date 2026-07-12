"""Storefront builder and public shop pages."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.schemas.laundry import LaundryDetailResponse, LaundryServiceResponse
from app.schemas.storefront import (
    ApplyTemplateRequest,
    PublicStorefrontResponse,
    StorefrontResponse,
    StorefrontTemplateInfo,
    StorefrontUpdateRequest,
)
from app.services.storefront_service import FACILITY_OPTIONS, GALLERY_CATEGORIES, StorefrontService

router = APIRouter(tags=["storefront"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.get("/partner/storefront/templates")
async def list_templates(request: Request, session: SessionDep) -> dict:
    data = [StorefrontTemplateInfo.model_validate(t) for t in StorefrontService(session).list_templates()]
    return success_envelope(data, request)


@router.get("/partner/storefront/options")
async def storefront_options(request: Request) -> dict:
    return success_envelope(
        {"facilities": FACILITY_OPTIONS, "gallery_categories": GALLERY_CATEGORIES},
        request,
    )


@router.get("/partner/storefront")
async def get_partner_storefront(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await StorefrontService(session).get_for_partner(UUID(payload["sub"]))
    return success_envelope(StorefrontResponse.model_validate(data), request)


@router.put("/partner/storefront")
async def update_partner_storefront(
    body: StorefrontUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await StorefrontService(session).update_for_partner(UUID(payload["sub"]), body)
    return success_envelope(StorefrontResponse.model_validate(data), request)


@router.post("/partner/storefront/apply-template")
async def apply_storefront_template(
    body: ApplyTemplateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await StorefrontService(session).apply_template(UUID(payload["sub"]), body.template_id)
    return success_envelope(StorefrontResponse.model_validate(data), request)


@router.post("/partner/storefront/upload")
async def upload_storefront_image(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    file: UploadFile = File(...),
) -> dict:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("Only JPEG, PNG, WebP, or GIF images are allowed")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValidationError("Image must be 5 MB or smaller")

    svc = StorefrontService(session)
    laundry = await svc._require_partner_laundry(UUID(payload["sub"]))
    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(file.content_type or "", ".jpg")
    filename = f"{uuid4()}{ext}"
    dest_dir = settings.storefront_upload_path / str(laundry.id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / filename
    dest.write_bytes(raw)
    url = f"/api/v1/media/storefront/{laundry.id}/{filename}"
    return success_envelope({"url": url}, request)

