"""Delivery OTP verification endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner, get_current_user_payload
from app.schemas.delivery_otp import DeliveryOtpVerifyRequest
from app.services.delivery_otp_service import DeliveryOtpService
from app.services.order_service import OrderService

router = APIRouter(tags=["delivery-otp"])


@router.get("/orders/{order_id}/delivery-otp")
async def get_customer_delivery_otp(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await DeliveryOtpService(session).get_customer_otp(UUID(payload["sub"]), order_id)
    return success_envelope(data, request)


@router.get("/orders/{order_id}/delivery-verification")
async def get_delivery_verification_status(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    await OrderService(session).get_for_user(UUID(payload["sub"]), order_id)
    data = await DeliveryOtpService(session).get_status_for_order(order_id)
    return success_envelope(data, request)


@router.get("/partner/orders/{order_id}/delivery-verification")
async def get_partner_delivery_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    from app.repositories.laundry import LaundryRepository
    from app.repositories.order import OrderRepository
    from app.core.exceptions import NotFoundError

    laundry = await LaundryRepository(session).get_by_owner(UUID(payload["sub"]))
    order = await OrderRepository(session).get_by_id(order_id)
    if not order or not laundry or order.laundry_id != laundry.id:
        raise NotFoundError("Order not found")
    data = await DeliveryOtpService(session).get_status_for_order(order_id)
    return success_envelope(data, request)


@router.post("/partner/orders/{order_id}/delivery/verify")
async def verify_delivery_otp(
    order_id: UUID,
    body: DeliveryOtpVerifyRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await DeliveryOtpService(session).verify_and_complete_delivery(
        UUID(payload["sub"]),
        order_id,
        code=body.code,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    return success_envelope(data, request)


@router.get("/admin/orders/{order_id}/delivery-verification")
async def get_admin_delivery_verification(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DeliveryOtpService(session).get_status_for_order(order_id)
    return success_envelope(data, request)
