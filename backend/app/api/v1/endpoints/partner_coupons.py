"""Partner shop coupon CRUD."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.schemas.partner_coupon import (
    PartnerCouponCreate,
    PartnerCouponItem,
    PartnerCouponUpdate,
    PartnerCouponValidateRequest,
    PartnerCouponValidateResult,
)
from app.services.partner_coupon_service import PartnerCouponService

router = APIRouter(prefix="/partner/coupons", tags=["partner-coupons"])


@router.get("")
async def list_partner_coupons(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    rows = await PartnerCouponService(session).list_coupons(UUID(payload["sub"]))
    return success_envelope([PartnerCouponItem.model_validate(r) for r in rows], request)


@router.post("")
async def create_partner_coupon(
    body: PartnerCouponCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerCouponService(session).create_coupon(
        UUID(payload["sub"]),
        code=body.code,
        discount_percent=body.discount_percent,
        is_active=body.is_active,
    )
    return success_envelope(PartnerCouponItem.model_validate(row), request)


@router.patch("/{coupon_id}")
async def update_partner_coupon(
    coupon_id: UUID,
    body: PartnerCouponUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerCouponService(session).update_coupon(
        UUID(payload["sub"]),
        coupon_id,
        code=body.code,
        discount_percent=body.discount_percent,
        is_active=body.is_active,
    )
    return success_envelope(PartnerCouponItem.model_validate(row), request)


@router.delete("/{coupon_id}")
async def delete_partner_coupon(
    coupon_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    await PartnerCouponService(session).delete_coupon(UUID(payload["sub"]), coupon_id)
    return success_envelope({"deleted": True}, request)


@router.post("/validate")
async def validate_partner_coupon(
    body: PartnerCouponValidateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    coupon = await PartnerCouponService(session).validate_code(UUID(payload["sub"]), body.code)
    return success_envelope(
        PartnerCouponValidateResult(code=coupon.code, discount_percent=coupon.discount_percent),
        request,
    )
