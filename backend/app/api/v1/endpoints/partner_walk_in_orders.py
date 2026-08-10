"""Partner walk-in order endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.core.exceptions import NotFoundError
from app.core.pagination import DEFAULT_PAGE_SIZE, build_paginated_response
from app.schemas.common import PaginatedListResponse
from app.schemas.order import OrderItemResponse
from app.schemas.walk_in_order import (
    WalkInOrderCreateRequest,
    WalkInOrderResponse,
    WalkInOrderWhatsAppNotifyResponse,
)
from app.services.notifications.order_received_whatsapp import whatsapp_order_received_meta
from app.services.walk_in_order_service import WalkInOrderService

router = APIRouter(prefix="/partner/walk-in-orders", tags=["partner"])


def _walk_in_order_response(order, *, laundry_name: str | None = None) -> WalkInOrderResponse:
    whatsapp_meta = None
    if laundry_name:
        whatsapp_meta = WalkInOrderWhatsAppNotifyResponse.model_validate(
            whatsapp_order_received_meta(order, laundry_name=laundry_name),
        )
    return WalkInOrderResponse(
        id=order.id,
        laundry_id=order.laundry_id,
        status=order.status,
        tracking_code=order.tracking_code,
        color_token=order.color_token,
        token_code=order.token_code,
        token_day_number=order.token_day_number,
        pickup_at=order.pickup_at,
        delivery_at=order.delivery_at,
        subtotal_inr=order.subtotal_inr,
        delivery_fee_inr=order.delivery_fee_inr,
        cgst_inr=order.cgst_inr,
        sgst_inr=order.sgst_inr,
        total_inr=order.total_inr,
        payment_status=order.payment_status.value,
        customer_name=order.customer_name or "Walk-in customer",
        customer_phone=order.customer_phone or "",
        partner_notes=order.partner_notes,
        user_id=order.user_id,
        expected_ready_at=order.delivery_at,
        items=[OrderItemResponse.model_validate(i) for i in order.items],
        whatsapp_order_received=whatsapp_meta,
    )


@router.post("", status_code=201)
async def create_walk_in_order(
    body: WalkInOrderCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    order = await WalkInOrderService(session).create(
        UUID(payload["sub"]),
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        items=[item.model_dump(mode="json") for item in body.items],
        notes=body.notes,
        customer_gender=body.customer_gender.value if body.customer_gender else None,
        expected_ready_at=body.expected_ready_at,
        coupon_code=body.coupon_code,
    )
    from app.repositories.laundry import LaundryRepository

    laundry = await LaundryRepository(session).get_by_id(order.laundry_id)
    laundry_name = laundry.name if laundry else "your laundry"
    return success_envelope(_walk_in_order_response(order, laundry_name=laundry_name), request)


@router.get("")
async def list_walk_in_orders(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=120),
) -> dict:
    try:
        result = await WalkInOrderService(session).list_for_partner(
            UUID(payload["sub"]),
            page=page,
            page_size=page_size,
            search=search,
        )
    except NotFoundError:
        return success_envelope(
            PaginatedListResponse[WalkInOrderResponse].empty(page=page, page_size=page_size),
            request,
        )
    items = [_walk_in_order_response(order) for order in result["items"]]
    return success_envelope(
        PaginatedListResponse[WalkInOrderResponse].model_validate(
            build_paginated_response(
                items=items,
                total_records=result["total_records"],
                page=result["page"],
                page_size=result["page_size"],
            ),
        ),
        request,
    )
