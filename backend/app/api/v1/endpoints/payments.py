"""Payments (Razorpay + COD)."""

from __future__ import annotations

import json
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.models.enums import PaymentMethod, PaymentStatus
from app.repositories.order import OrderRepository
from app.services.payments.provider import get_payment_provider
from app.services.trust_score_service import TrustScoreService
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.fraud_detection_service import FraudDetectionService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/orders/{order_id}/razorpay")
async def create_razorpay_order(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    order = await OrderRepository(session).get_by_id(order_id)
    if not order or order.user_id != UUID(payload["sub"]):
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Order not found")
    provider = get_payment_provider()
    result = await provider.create_order(order.id, order.total_inr)
    order.payment_method = PaymentMethod.razorpay
    order.payment_status = PaymentStatus.pending
    await session.flush()
    return success_envelope(result, request)


@router.post("/orders/{order_id}/cod")
async def select_cod(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    order = await OrderRepository(session).get_by_id(order_id)
    if not order or order.user_id != UUID(payload["sub"]):
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Order not found")
    order.payment_method = PaymentMethod.cod
    order.payment_status = PaymentStatus.pending_cod
    await session.flush()
    return success_envelope({"status": "pending_cod"}, request)


@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, session: SessionDep) -> dict:
    body = await request.body()
    sig = request.headers.get("X-Razorpay-Signature", "")
    await get_payment_provider().verify_webhook(body, sig)

    try:
        payload = json.loads(body.decode())
    except json.JSONDecodeError:
        return success_envelope({"received": True}, request)

    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id_raw = entity.get("notes", {}).get("dlm_order_id")
    if order_id_raw:
        try:
            order_id = UUID(str(order_id_raw))
            order = await OrderRepository(session).get_by_id(order_id)
            if order:
                trust = TrustScoreService(session)
                laundry_trust = LaundryTrustScoreService(session)
                if event == "payment.failed":
                    order.payment_status = PaymentStatus.failed
                    await trust.on_failed_payment(order.user_id, order.id)
                    await FraudDetectionService(session).on_payment_failed(order.user_id)
                elif event in ("payment.dispute.created", "payment.dispute.lost"):
                    await trust.on_chargeback(order.user_id, order.id)
                elif event == "refund.processed":
                    order.payment_status = PaymentStatus.refunded
                    await laundry_trust.recalculate(order.laundry_id)
        except (ValueError, TypeError):
            pass

    return success_envelope({"received": True}, request)
