"""Partner panel APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner, get_current_user_payload
from app.schemas.laundry import LaundryDetailResponse, PartnerLaundryRegisterRequest
from app.schemas.order import OrderItemResponse, OrderResponse, OrderStatusUpdateRequest
from app.schemas.partner import (
    InventoryResponse,
    InventoryUpdateRequest,
    PartnerAnalyticsResponse,
    PartnerCustomerSummary,
    PartnerOrderResponse,
    StaffCreateRequest,
    StaffResponse,
)
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.laundry_service import LaundryService
from app.services.order_service import OrderService
from app.services.partner_service import PartnerService
from app.repositories.order import OrderRepository

router = APIRouter(prefix="/partner", tags=["partner"])


@router.post("/laundries", status_code=201)
async def register_laundry(
    body: PartnerLaundryRegisterRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    laundry = await LaundryService(session).register_partner_laundry(
        UUID(payload["sub"]),
        name=body.name,
        city=body.city,
        address_line=body.address_line,
        description=body.description,
    )
    return success_envelope(LaundryDetailResponse.model_validate(laundry), request)


def _partner_order_response(order, customer_name: str) -> PartnerOrderResponse:
    return PartnerOrderResponse(
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
        customer_name=customer_name,
        customer_phone=order.customer_phone,
        order_source=order.order_source,
        items=[OrderItemResponse.model_validate(i) for i in order.items],
    )


@router.get("/orders")
async def partner_orders(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.core.exceptions import NotFoundError

    try:
        rows = await PartnerService(session).list_orders_for_partner(UUID(payload["sub"]))
    except NotFoundError:
        return success_envelope([], request)
    data = [_partner_order_response(order, name) for order, name in rows]
    return success_envelope(data, request)


@router.get("/customers")
async def partner_customers(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.core.exceptions import NotFoundError

    try:
        rows = await PartnerService(session).list_customers(UUID(payload["sub"]))
    except NotFoundError:
        rows = []
    data = [PartnerCustomerSummary.model_validate(r) for r in rows]
    return success_envelope(data, request)


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: UUID,
    body: OrderStatusUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    order = await OrderService(session).update_status_partner(
        UUID(payload["sub"]),
        order_id,
        body.status,
    )
    return success_envelope(OrderResponse.model_validate(order), request)


@router.post("/orders/{order_id}/accept")
async def accept_order(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    order = await OrderService(session).accept_order(UUID(payload["sub"]), order_id)
    return success_envelope(OrderResponse.model_validate(order), request)


@router.post("/orders/{order_id}/reject")
async def reject_order(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    order = await OrderService(session).reject_order(UUID(payload["sub"]), order_id)
    return success_envelope(OrderResponse.model_validate(order), request)


@router.get("/analytics/summary")
async def partner_analytics(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.core.exceptions import NotFoundError

    partner_id = UUID(payload["sub"])
    try:
        data = await PartnerService(session).analytics_summary(partner_id)
    except NotFoundError:
        data = await PartnerService(session).empty_analytics_summary(partner_id)
    return success_envelope(PartnerAnalyticsResponse.model_validate(data), request)


@router.get("/trust-score")
async def partner_trust_score(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await LaundryTrustScoreService(session).get_for_partner(UUID(payload["sub"]))
    return success_envelope(data, request)


@router.get("/orders/{order_id}/inventory")
async def get_inventory(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerService(session).get_inventory(UUID(payload["sub"]), order_id)
    return success_envelope(
        InventoryResponse(
            order_id=row.order_id,
            expected_count=row.expected_count,
            received_count=row.received_count,
            missing_notes=row.missing_notes,
            damaged_notes=row.damaged_notes,
        ),
        request,
    )


@router.put("/orders/{order_id}/inventory")
async def update_inventory(
    order_id: UUID,
    body: InventoryUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerService(session).update_inventory(
        UUID(payload["sub"]),
        order_id,
        expected_count=body.expected_count,
        received_count=body.received_count,
        missing_notes=body.missing_notes,
        damaged_notes=body.damaged_notes,
    )
    return success_envelope(
        InventoryResponse(
            order_id=row.order_id,
            expected_count=row.expected_count,
            received_count=row.received_count,
            missing_notes=row.missing_notes,
            damaged_notes=row.damaged_notes,
        ),
        request,
    )


@router.get("/staff")
async def list_staff(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    rows = await PartnerService(session).list_staff(UUID(payload["sub"]))
    data = [StaffResponse.model_validate(r) for r in rows]
    return success_envelope(data, request)


@router.post("/staff", status_code=201)
async def create_staff(
    body: StaffCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerService(session).create_staff(
        UUID(payload["sub"]),
        name=body.name,
        phone=body.phone,
        role=body.role,
    )
    return success_envelope(StaffResponse.model_validate(row), request)


@router.delete("/staff/{staff_id}", status_code=204, response_class=Response)
async def delete_staff(
    staff_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> Response:
    await PartnerService(session).delete_staff(UUID(payload["sub"]), staff_id)
    return Response(status_code=204)


@router.post("/scan/{tracking_code}")
async def scan_tracking(
    tracking_code: str,
    body: OrderStatusUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.repositories.laundry import LaundryRepository

    laundry = await LaundryRepository(session).get_by_owner(UUID(payload["sub"]))
    order = await OrderRepository(session).get_by_tracking_code(tracking_code)
    if not order or not laundry or order.laundry_id != laundry.id:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Order not found")
    order = await OrderService(session).update_status_partner(
        UUID(payload["sub"]),
        order.id,
        body.status,
    )
    return success_envelope(OrderResponse.model_validate(order), request)
