"""Partner garment price-list API (platform catalog + laundry overrides)."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.models.enums import CatalogCategory
from app.schemas.partner_price_list import (
    ApplySuggestedResult,
    PartnerPriceItemPatch,
    PartnerPriceListBulkPut,
    PartnerPriceListItemOut,
    PartnerPriceListResponse,
)
from app.services.partner_price_list_service import PartnerPriceListService

router = APIRouter(prefix="/partner/price-list", tags=["partner-price-list"])


@router.get(
    "",
    summary="List platform catalog with this laundry's price overrides",
    response_description="Full catalog joined with suggested + current partner prices",
)
async def get_partner_price_list(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    category: Annotated[CatalogCategory | None, Query()] = None,
) -> dict:
    data = await PartnerPriceListService(session).get_price_list(
        UUID(payload["sub"]),
        category=category,
    )
    return success_envelope(PartnerPriceListResponse.model_validate(data), request)


@router.put(
    "",
    summary="Bulk upsert partner prices and is_offered flags",
)
async def put_partner_price_list(
    body: PartnerPriceListBulkPut,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerPriceListService(session).bulk_upsert(
        UUID(payload["sub"]),
        body.items,
    )
    return success_envelope(PartnerPriceListResponse.model_validate(data), request)


@router.patch(
    "/{catalog_item_id}",
    summary="Update a single catalog item price / offer flag",
)
async def patch_partner_price_item(
    catalog_item_id: UUID,
    body: PartnerPriceItemPatch,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerPriceListService(session).patch_item(
        UUID(payload["sub"]),
        catalog_item_id,
        body,
    )
    return success_envelope(PartnerPriceListItemOut.model_validate(data), request)


@router.post(
    "/apply-suggested",
    summary="Copy platform suggested prices for items missing overrides",
    response_description="Idempotent — existing overrides are skipped",
)
async def apply_suggested_prices(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await PartnerPriceListService(session).apply_suggested(UUID(payload["sub"]))
    return success_envelope(ApplySuggestedResult.model_validate(data), request)
