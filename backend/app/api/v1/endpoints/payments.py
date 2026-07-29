"""Payments (Razorpay + COD)."""

from __future__ import annotations

import json
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.models.enums import PaymentMethod, PaymentStatus
from app.models.payment import Payment
from app.repositories.order import OrderRepository
from app.services.fraud_detection_service import FraudDetectionService
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.payments.provider import get_payment_provider
from app.services.trust_score_service import TrustScoreService

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
    """Razorpay webhook. Signature-verified; status transitions are idempotent.

    Idempotency notes (stub-friendly):
    - `payment.captured` no-ops if already `paid` / `refunded`.
    - `payment.failed` does not overwrite `paid` / `refunded`.
    - `refund.processed` no-ops if already `refunded`.
    - Replays with the same event + terminal state are safe.
    """
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
                if event == "payment.captured":
                    await _apply_payment_captured(session, order, entity)
                elif event == "payment.failed":
                    if order.payment_status not in (PaymentStatus.paid, PaymentStatus.refunded):
                        order.payment_status = PaymentStatus.failed
                        if order.user_id:
                            await trust.on_failed_payment(order.user_id, order.id)
                            await FraudDetectionService(session).on_payment_failed(order.user_id)
                elif event in ("payment.dispute.created", "payment.dispute.lost"):
                    if order.user_id:
                        await trust.on_chargeback(order.user_id, order.id)
                elif event == "refund.processed":
                    if order.payment_status != PaymentStatus.refunded:
                        order.payment_status = PaymentStatus.refunded
                        payment = await session.scalar(select(Payment).where(Payment.order_id == order.id))
                        if payment:
                            payment.status = PaymentStatus.refunded
                        await laundry_trust.recalculate(order.laundry_id)
        except (ValueError, TypeError):
            pass

    return success_envelope({"received": True}, request)


async def _apply_payment_captured(session, order, entity: dict) -> None:
    """Mark order paid and upsert Payment row (idempotent)."""
    if order.payment_status in (PaymentStatus.paid, PaymentStatus.refunded):
        return

    order.payment_method = PaymentMethod.razorpay
    order.payment_status = PaymentStatus.paid

    razorpay_payment_id = entity.get("id")
    razorpay_order_id = entity.get("order_id")
    payment = await session.scalar(select(Payment).where(Payment.order_id == order.id))
    if payment is None:
        payment = Payment(
            order_id=order.id,
            amount_inr=order.total_inr,
            status=PaymentStatus.paid,
            method=PaymentMethod.razorpay,
            razorpay_order_id=str(razorpay_order_id) if razorpay_order_id else None,
            razorpay_payment_id=str(razorpay_payment_id) if razorpay_payment_id else None,
        )
        session.add(payment)
    else:
        payment.status = PaymentStatus.paid
        payment.method = PaymentMethod.razorpay
        if razorpay_order_id:
            payment.razorpay_order_id = str(razorpay_order_id)
        if razorpay_payment_id:
            payment.razorpay_payment_id = str(razorpay_payment_id)

    await session.flush()
