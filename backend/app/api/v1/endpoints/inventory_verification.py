"""Item inventory verification endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner, get_current_user_payload
from app.schemas.inventory_verification import (
    InventoryChangeRequestInput,
    InventoryChangeReviewRequest,
    InventoryRecordRequest,
    items_input_to_dict,
)
from app.services.inventory_verification_service import InventoryVerificationService

router = APIRouter(tags=["inventory-verification"])


@router.get("/partner/orders/{order_id}/inventory-verification")
async def get_partner_inventory_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await InventoryVerificationService(session).get_for_partner(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.put("/partner/orders/{order_id}/inventory-verification")
async def record_partner_inventory_verification(
    order_id: UUID,
    body: InventoryRecordRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await InventoryVerificationService(session).record_for_partner(
        UUID(payload["sub"]),
        order_id,
        items=items_input_to_dict(body.items),
        note=body.note,
    )
    return success_envelope(data, request)


@router.post("/partner/orders/{order_id}/inventory-verification/change-request", status_code=201)
async def request_inventory_change(
    order_id: UUID,
    body: InventoryChangeRequestInput,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await InventoryVerificationService(session).request_change(
        UUID(payload["sub"]),
        order_id,
        items=items_input_to_dict(body.items),
        reason=body.reason,
    )
    return success_envelope(data, request)


@router.get("/orders/{order_id}/inventory-verification")
async def get_customer_inventory_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await InventoryVerificationService(session).get_for_customer(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.post("/orders/{order_id}/inventory-verification/confirm")
async def confirm_customer_inventory_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await InventoryVerificationService(session).confirm_for_customer(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.get("/orders/{order_id}/inventory-verification/history")
async def get_inventory_history(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    from app.services.order_service import OrderService

    await OrderService(session).get_for_user(UUID(payload["sub"]), order_id)
    data = await InventoryVerificationService(session).list_history(order_id)
    return success_envelope(data, request)


@router.get("/admin/orders/{order_id}/inventory-verification")
async def get_admin_inventory_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await InventoryVerificationService(session).get_for_admin(order_id)
    return success_envelope(data, request)


@router.get("/admin/inventory-change-requests")
async def list_inventory_change_requests(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await InventoryVerificationService(session).list_pending_changes_admin()
    return success_envelope(data, request)


@router.post("/admin/inventory-change-requests/{request_id}/approve")
async def approve_inventory_change(
    request_id: UUID,
    body: InventoryChangeReviewRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await InventoryVerificationService(session).approve_change(
        UUID(payload["sub"]),
        request_id,
        admin_notes=body.admin_notes,
    )
    return success_envelope(data, request)


@router.post("/admin/inventory-change-requests/{request_id}/reject")
async def reject_inventory_change(
    request_id: UUID,
    body: InventoryChangeReviewRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await InventoryVerificationService(session).reject_change(
        UUID(payload["sub"]),
        request_id,
        admin_notes=body.admin_notes,
    )
    return success_envelope(data, request)
