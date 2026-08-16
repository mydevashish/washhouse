"""Partner garment catalog API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from fastapi.responses import Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.core.config import settings
from app.core.exceptions import ValidationError
from app.models.enums import GarmentCategory
from app.schemas.garment_catalog import (
    GarmentBulkDeleteRequest,
    GarmentBulkDeleteResponse,
    GarmentBulkVisibleRequest,
    GarmentBulkVisibleResponse,
    GarmentCatalogCreate,
    GarmentCatalogItemOut,
    GarmentCatalogListResponse,
    GarmentCatalogSummaryOut,
    GarmentCatalogUpdate,
    GarmentImageUploadResponse,
    GarmentImportConfirmRequest,
    GarmentImportConfirmResponse,
    GarmentImportPreviewResponse,
)
from app.services.partner_garment_catalog_service import PartnerGarmentCatalogService

router = APIRouter(prefix="/partner/garment-catalog", tags=["partner-garment-catalog"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.get(
    "",
    summary="Paginated garment catalog for this laundry",
)
async def list_partner_garment_catalog(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    category: Annotated[GarmentCategory | None, Query()] = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
) -> dict:
    data = await PartnerGarmentCatalogService(session).list_garments(
        UUID(payload["sub"]),
        category=category,
        search=search,
        page=page,
        page_size=page_size,
    )
    return success_envelope(GarmentCatalogListResponse.model_validate(data), request)


@router.get(
    "/summary",
    summary="Garment catalog KPI counts",
)
async def partner_garment_catalog_summary(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).summary(UUID(payload["sub"]))
    return success_envelope(GarmentCatalogSummaryOut.model_validate(data), request)


@router.get(
    "/template",
    summary="Download bulk import template (xlsx)",
    response_class=Response,
)
async def download_garment_catalog_template(
    payload: Annotated[dict, Depends(get_current_partner)],
    session: SessionDep,
) -> Response:
    _ = payload, session
    content = await PartnerGarmentCatalogService(session).export_template()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="garment-catalog-template.xlsx"'},
    )


@router.post(
    "/import/preview",
    summary="Preview bulk import file",
)
async def preview_garment_catalog_import(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    file: UploadFile = File(...),
) -> dict:
    raw = await file.read()
    if not raw:
        raise ValidationError("Uploaded file is empty")
    filename = file.filename or "upload.xls"
    data = await PartnerGarmentCatalogService(session).import_preview(
        UUID(payload["sub"]),
        raw,
        filename,
    )
    return success_envelope(GarmentImportPreviewResponse.model_validate(data), request)


@router.post(
    "/import",
    summary="Confirm bulk import from preview",
)
async def confirm_garment_catalog_import(
    body: GarmentImportConfirmRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).import_confirm(
        UUID(payload["sub"]),
        preview_id=body.preview_id,
        mode=body.mode,
        skip_invalid=body.skip_invalid,
    )
    return success_envelope(GarmentImportConfirmResponse.model_validate(data), request)


@router.post(
    "/bulk-visible",
    summary="Set is_visible for multiple garments (current page bulk action)",
)
async def bulk_set_garment_catalog_visible(
    body: GarmentBulkVisibleRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).bulk_set_visible(
        UUID(payload["sub"]),
        ids=body.ids,
        is_visible=True,
    )
    return success_envelope(GarmentBulkVisibleResponse.model_validate(data), request)


@router.post(
    "/bulk-delete",
    summary="Bulk delete garments by ids, category, or entire catalog",
)
async def bulk_delete_garment_catalog(
    body: GarmentBulkDeleteRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).bulk_delete(
        UUID(payload["sub"]),
        ids=body.ids,
        category=body.category,
        delete_all=body.delete_all,
        confirm=body.confirm,
    )
    return success_envelope(GarmentBulkDeleteResponse.model_validate(data), request)


@router.post(
    "",
    summary="Create a garment with service-type rates",
)
async def create_partner_garment(
    body: GarmentCatalogCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).create_garment(
        UUID(payload["sub"]),
        body.model_dump(),
    )
    return success_envelope(GarmentCatalogItemOut.model_validate(data), request)


@router.get(
    "/{garment_id}",
    summary="Get one garment with rates",
)
async def get_partner_garment(
    garment_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).get_garment(
        UUID(payload["sub"]),
        garment_id,
    )
    return success_envelope(GarmentCatalogItemOut.model_validate(data), request)


@router.patch(
    "/{garment_id}",
    summary="Update garment fields and/or rates",
)
async def update_partner_garment(
    garment_id: UUID,
    body: GarmentCatalogUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerGarmentCatalogService(session).update_garment(
        UUID(payload["sub"]),
        garment_id,
        body.model_dump(exclude_unset=True),
    )
    return success_envelope(GarmentCatalogItemOut.model_validate(data), request)


@router.delete(
    "/{garment_id}",
    summary="Soft delete one garment",
)
async def delete_partner_garment(
    garment_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    await PartnerGarmentCatalogService(session).delete_garment(UUID(payload["sub"]), garment_id)
    return success_envelope({"deleted": True}, request)


@router.post(
    "/{garment_id}/image",
    summary="Upload garment image",
)
async def upload_partner_garment_image(
    garment_id: UUID,
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
    data = await PartnerGarmentCatalogService(session).upload_garment_image(
        UUID(payload["sub"]),
        garment_id,
        raw,
        file.content_type or "image/jpeg",
    )
    return success_envelope(GarmentImageUploadResponse.model_validate(data), request)
