"""Partner walk-in order endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.schemas.order import OrderItemResponse
from app.schemas.walk_in_order import WalkInOrderCreateRequest, WalkInOrderResponse
from app.services.walk_in_order_service import WalkInOrderService

router = APIRouter(prefix="/partner/walk-in-orders", tags=["partner"])


def _walk_in_order_response(order) -> WalkInOrderResponse:
    return WalkInOrderResponse(
        id=order.id,
        laundry_id=order.laundry_id,
        status=order.status,
        tracking_code=order.tracking_code,
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
        items=[item.model_dump() for item in body.items],
        notes=body.notes,
        expected_ready_at=body.expected_ready_at,
    )
    return success_envelope(_walk_in_order_response(order), request)


@router.get("")
async def list_walk_in_orders(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.core.exceptions import NotFoundError

    try:
        orders = await WalkInOrderService(session).list_for_partner(UUID(payload["sub"]))
    except NotFoundError:
        orders = []
    data = [_walk_in_order_response(order) for order in orders]
    return success_envelope(data, request)
