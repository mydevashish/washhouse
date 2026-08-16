"""Partner panel APIs."""

from __future__ import annotations

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import HTMLResponse

from app.api.partner_orders_list_params import PartnerOrdersListParamsDep
from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner, get_current_user_payload
from app.core.pagination import build_paginated_response
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.schemas.common import PaginatedListResponse
from app.schemas.laundry import LaundryDetailResponse, PartnerLaundryRegisterRequest
from app.schemas.order import OrderItemResponse, OrderResponse, OrderStatusUpdateRequest
from app.schemas.order_invoice import InvoicePrintVariant
from app.schemas.partner import (
    InventoryResponse,
    InventoryUpdateRequest,
    PartnerAnalyticsDashboardResponse,
    PartnerAnalyticsOverviewResponse,
    PartnerAnalyticsResponse,
    PartnerCustomerSummary,
    PartnerOrderResponse,
    StaffCreateRequest,
    StaffResponse,
    StaffUpdateRequest,
)
from app.schemas.walk_in_order import WalkInOrderWhatsAppRetryResponse
from app.services.laundry_service import LaundryService
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.order_invoice_service import OrderInvoiceService
from app.services.order_payment_snapshot import compute_order_payment_snapshot
from app.services.order_service import OrderService
from app.services.order_tags_service import OrderTagsService
from app.services.partner_service import PartnerService
from app.tasks.order_notifications import deliver_order_received_whatsapp

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
    # Avoid lazy-loading `services` outside an async greenlet context.
    detail = LaundryDetailResponse.model_validate(
        {
            "id": laundry.id,
            "name": laundry.name,
            "slug": laundry.slug,
            "city": laundry.city,
            "avg_rating": laundry.avg_rating,
            "review_count": laundry.review_count,
            "is_verified": laundry.is_verified,
            "description": laundry.description,
            "address_line": laundry.address_line,
            "services": [],
        },
    )
    return success_envelope(detail, request)


def _partner_order_response(order, customer_name: str, payment=None) -> PartnerOrderResponse:
    amounts = compute_order_payment_snapshot(order, payment)
    return PartnerOrderResponse(
        id=order.id,
        laundry_id=order.laundry_id,
        status=order.status,
        tracking_code=order.tracking_code,
        color_token=order.color_token,
        token_code=order.token_code,
        token_day_number=order.token_day_number,
        pickup_at=order.pickup_at,
        delivery_at=order.delivery_at,
        created_at=order.created_at,
        address_line1=order.address_line1,
        address_line2=order.address_line2,
        address_city=order.address_city,
        address_pincode=order.address_pincode,
        subtotal_inr=order.subtotal_inr,
        delivery_fee_inr=order.delivery_fee_inr,
        cgst_inr=order.cgst_inr,
        sgst_inr=order.sgst_inr,
        total_inr=order.total_inr,
        paid_inr=amounts["paid_inr"],
        pending_inr=amounts["pending_inr"],
        payment_status=order.payment_status.value,
        customer_name=customer_name,
        customer_phone=order.customer_phone,
        order_source=order.order_source,
        items=[OrderItemResponse.model_validate(i) for i in order.items],
    )


async def _payment_map_for_orders(session, order_ids: list[UUID]) -> dict[UUID, object]:
    if not order_ids:
        return {}
    from sqlalchemy import select

    from app.models.payment import Payment

    rows = await session.scalars(select(Payment).where(Payment.order_id.in_(order_ids)))
    return {payment.order_id: payment for payment in rows}


@router.get("/orders")
async def partner_orders(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    params: PartnerOrdersListParamsDep,
) -> dict:
    from app.core.exceptions import NotFoundError

    try:
        result = await PartnerService(session).list_orders_for_partner_paginated(
            UUID(payload["sub"]),
            params,
        )
    except NotFoundError:
        return success_envelope(
            PaginatedListResponse[PartnerOrderResponse].empty(
                page=params.page,
                page_size=params.page_size,
            ),
            request,
        )

    payment_by_order = await _payment_map_for_orders(
        session,
        [order.id for order, _name in result["items"]],
    )
    items = [
        _partner_order_response(order, name, payment_by_order.get(order.id))
        for order, name in result["items"]
    ]
    payload_body = PaginatedListResponse[PartnerOrderResponse].model_validate(
        build_paginated_response(
            items=items,
            total_records=result["total_records"],
            page=result["page"],
            page_size=result["page_size"],
        ),
    )
    return success_envelope(payload_body, request)


@router.get("/orders/{order_id}")
async def partner_order_detail(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from sqlalchemy import select

    from app.models.user import User

    order = await OrderService(session).get_for_partner(UUID(payload["sub"]), order_id)
    user_name = None
    if order.user_id is not None:
        user_name = await session.scalar(select(User.full_name).where(User.id == order.user_id))
    display_name = user_name or order.customer_name or "Walk-in customer"
    payment_by_order = await _payment_map_for_orders(session, [order.id])
    return success_envelope(
        _partner_order_response(order, display_name, payment_by_order.get(order.id)),
        request,
    )


@router.get("/orders/{order_id}/tags")
async def partner_order_tags(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    per_piece: Annotated[bool, Query()] = False,
) -> dict:
    """JSON payload for Shop Floor bag + item tag print UI."""
    tags = await OrderTagsService(session).get_tags_for_partner(
        UUID(payload["sub"]),
        order_id,
        per_piece=per_piece,
    )
    return success_envelope(tags, request)


@router.get("/orders/{order_id}/tags/print", response_class=HTMLResponse)
async def partner_order_tags_print(
    order_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    per_piece: Annotated[bool, Query()] = False,
) -> HTMLResponse:
    """Optional HTML thermal print view (58mm-friendly)."""
    service = OrderTagsService(session)
    tags = await service.get_tags_for_partner(
        UUID(payload["sub"]),
        order_id,
        per_piece=per_piece,
    )
    html = service.render_print_html(tags)
    return HTMLResponse(content=html)


@router.get("/orders/{order_id}/invoice")
async def partner_order_invoice(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    """JSON invoice snapshot for counter bill / A4 GST print (idempotent)."""
    invoice = await OrderInvoiceService(session).get_invoice_for_partner(
        UUID(payload["sub"]),
        order_id,
    )
    return success_envelope(invoice, request)


@router.get("/orders/{order_id}/invoice/print", response_class=HTMLResponse)
async def partner_order_invoice_print(
    order_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    variant: Annotated[InvoicePrintVariant, Query()] = InvoicePrintVariant.bill,
) -> HTMLResponse:
    """HTML print: thermal counter bill (`bill`) or A4 GST invoice (`gst`)."""
    service = OrderInvoiceService(session)
    invoice = await service.get_invoice_for_partner(UUID(payload["sub"]), order_id)
    html = service.render_print_html(invoice, variant=variant)
    return HTMLResponse(content=html)


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


@router.post("/orders/{order_id}/whatsapp/order-received")
async def retry_order_received_whatsapp(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.core.exceptions import NotFoundError

    partner_id = UUID(payload["sub"])
    laundry = await LaundryRepository(session).get_by_owner(partner_id)
    if not laundry:
        raise NotFoundError("Partner laundry not found")

    order = await OrderRepository(session).get_by_id(order_id)
    if not order or order.laundry_id != laundry.id:
        raise NotFoundError("Order not found")

    result = await deliver_order_received_whatsapp(
        session,
        order,
        laundry_name=laundry.name,
    )
    return success_envelope(WalkInOrderWhatsAppRetryResponse.model_validate(result), request)


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
    period: Annotated[
        str | None,
        Query(description="Optional IST money window: today | week | month | year | custom"),
    ] = None,
    date_from: Annotated[date | None, Query(description="Inclusive IST start (YYYY-MM-DD) for custom")] = None,
    date_to: Annotated[date | None, Query(description="Inclusive IST end (YYYY-MM-DD) for custom")] = None,
) -> dict:
    from app.core.exceptions import NotFoundError

    partner_id = UUID(payload["sub"])
    try:
        data = await PartnerService(session).analytics_summary(
            partner_id,
            period_key=period,
            date_from=date_from,
            date_to=date_to,
        )
    except NotFoundError:
        data = await PartnerService(session).empty_analytics_summary(
            partner_id,
            period_key=period,
            date_from=date_from,
            date_to=date_to,
        )
    return success_envelope(PartnerAnalyticsResponse.model_validate(data), request)


@router.get("/analytics/overview")
async def partner_analytics_overview(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    period: Annotated[str, Query(description="today | week | month")] = "today",
) -> dict:
    from app.core.exceptions import NotFoundError

    partner_id = UUID(payload["sub"])
    try:
        data = await PartnerService(session).analytics_overview(partner_id, period)
    except NotFoundError:
        data = await PartnerService(session).empty_analytics_overview(partner_id, period)
    return success_envelope(PartnerAnalyticsOverviewResponse.model_validate(data), request)


@router.get(
    "/analytics/dashboard",
    summary="Partner laundry dashboard (live home)",
    description=(
        "IST calendar KPIs (today/week/month vs previous), global status snapshot, "
        "chart series with previous-period overlay, period-scoped status donut, "
        "top services, payment mix, and bottom stats. "
        "`period` drives chart / donut / services / payments only (default week). "
        "Wallet is never tracked (`wallet_tracked` is always false)."
    ),
    responses={
        401: {"description": "Missing or invalid bearer token"},
        403: {"description": "Not a partner"},
        422: {"description": "Invalid period"},
    },
)
async def partner_analytics_dashboard(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    period: Annotated[str, Query(description="today | week | month | year")] = "week",
) -> dict:
    from app.core.exceptions import NotFoundError

    partner_id = UUID(payload["sub"])
    try:
        data = await PartnerService(session).analytics_dashboard(partner_id, period)
    except NotFoundError:
        data = await PartnerService(session).empty_analytics_dashboard(partner_id, period)
    return success_envelope(PartnerAnalyticsDashboardResponse.model_validate(data), request)


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


@router.patch("/staff/{staff_id}")
async def update_staff(
    staff_id: UUID,
    body: StaffUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    row = await PartnerService(session).update_staff(
        UUID(payload["sub"]),
        staff_id,
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

    laundries = await LaundryRepository(session).list_by_owner(UUID(payload["sub"]))
    laundry_ids = {laundry.id for laundry in laundries}
    order = await OrderRepository(session).get_by_tracking_code(tracking_code)
    if not order or order.laundry_id not in laundry_ids:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Order not found")
    order = await OrderService(session).update_status_partner(
        UUID(payload["sub"]),
        order.id,
        body.status,
    )
    return success_envelope(OrderResponse.model_validate(order), request)
