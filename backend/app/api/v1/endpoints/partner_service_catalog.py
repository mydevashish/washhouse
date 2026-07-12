"""Partner service catalog API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.schemas.customer_experience import ServiceCatalogCreate, ServiceCatalogItem, ServiceCatalogUpdate
from app.services.partner_service_catalog_service import PartnerServiceCatalogService

router = APIRouter(prefix="/partner/services", tags=["partner-services"])


@router.get("")
async def list_partner_services(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerServiceCatalogService(session).list_services(UUID(payload["sub"]))
    return success_envelope([ServiceCatalogItem.model_validate(r) for r in data], request)


@router.post("")
async def create_partner_service(
    body: ServiceCatalogCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerServiceCatalogService(session).create_service(UUID(payload["sub"]), body.model_dump())
    return success_envelope(ServiceCatalogItem.model_validate(data), request)


@router.patch("/{service_id}")
async def update_partner_service(
    service_id: UUID,
    body: ServiceCatalogUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerServiceCatalogService(session).update_service(
        UUID(payload["sub"]),
        service_id,
        body.model_dump(exclude_unset=True),
    )
    return success_envelope(ServiceCatalogItem.model_validate(data), request)


@router.delete("/{service_id}")
async def delete_partner_service(
    service_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    await PartnerServiceCatalogService(session).delete_service(UUID(payload["sub"]), service_id)
    return success_envelope({"deleted": True}, request)
