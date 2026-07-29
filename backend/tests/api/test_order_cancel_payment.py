"""Customer order cancel — payment reconciliation + IDOR."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.enums import (
    LaundryStatus,
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User

pytestmark = pytest.mark.asyncio


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _seed_customer_order(
    session: AsyncSession,
    *,
    payment_status: PaymentStatus = PaymentStatus.pending,
    payment_method: PaymentMethod | None = None,
    status: OrderStatus = OrderStatus.confirmed,
) -> tuple[User, Order, str]:
    customer = User(
        email=f"cancel.cust.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Cancel Test Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    session.add(customer)
    await session.flush()

    partner = User(
        email=f"cancel.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Cancel Test Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Cancel Test Laundry",
        slug=f"cancel-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Cancel Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    now = datetime.now(UTC)
    order = Order(
        user_id=customer.id,
        laundry_id=laundry.id,
        order_source=OrderSource.online,
        status=status,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now + timedelta(hours=2),
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("49.00"),
        cgst_inr=Decimal("22.41"),
        sgst_inr=Decimal("22.41"),
        total_inr=Decimal("293.82"),
        payment_status=payment_status,
        payment_method=payment_method,
    )
    session.add(order)
    await session.flush()

    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)
    return customer, order, token


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_cancel_cod_marks_payment_failed(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _customer, order, token = await _seed_customer_order(
        db_session,
        payment_status=PaymentStatus.pending_cod,
        payment_method=PaymentMethod.cod,
    )

    resp = await client.post(
        f"/api/v1/orders/{order.id}/cancel",
        headers=_headers(token),
        json={"reason": "Changed plans"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == OrderStatus.cancelled.value
    assert data["payment_status"] == PaymentStatus.failed.value


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_cancel_paid_razorpay_refunds_and_marks_refunded(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _customer, order, token = await _seed_customer_order(
        db_session,
        payment_status=PaymentStatus.paid,
        payment_method=PaymentMethod.razorpay,
    )
    db_session.add(
        Payment(
            order_id=order.id,
            amount_inr=order.total_inr,
            status=PaymentStatus.paid,
            method=PaymentMethod.razorpay,
            razorpay_payment_id="pay_test_123",
            razorpay_order_id="order_test_123",
        ),
    )
    await db_session.flush()

    resp = await client.post(f"/api/v1/orders/{order.id}/cancel", headers=_headers(token))
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == OrderStatus.cancelled.value
    assert data["payment_status"] == PaymentStatus.refunded.value

    payment = await db_session.scalar(select(Payment).where(Payment.order_id == order.id))
    assert payment is not None
    assert payment.status == PaymentStatus.refunded


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_cancel_idor_other_customer_gets_404(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _owner, order, _token = await _seed_customer_order(db_session)
    other = User(
        email=f"cancel.other.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Other Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(other)
    await db_session.flush()
    other_token = create_access_token(subject=str(other.id), role=UserRole.customer.value)

    resp = await client.post(
        f"/api/v1/orders/{order.id}/cancel",
        headers=_headers(other_token),
    )
    assert resp.status_code == 404


async def test_razorpay_webhook_payment_captured_idempotent(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _customer, order, _token = await _seed_customer_order(
        db_session,
        payment_status=PaymentStatus.pending,
        payment_method=PaymentMethod.razorpay,
    )

    body = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_captured_1",
                    "order_id": "order_rzp_1",
                    "notes": {"dlm_order_id": str(order.id)},
                },
            },
        },
    }
    raw = json.dumps(body).encode()

    with patch.object(settings, "RAZORPAY_WEBHOOK_SECRET", ""):
        # APP_ENV=test allows missing secret
        first = await client.post("/api/v1/payments/webhooks/razorpay", content=raw)
        second = await client.post("/api/v1/payments/webhooks/razorpay", content=raw)

    assert first.status_code == 200
    assert second.status_code == 200

    await db_session.refresh(order)
    assert order.payment_status == PaymentStatus.paid

    payment = await db_session.scalar(select(Payment).where(Payment.order_id == order.id))
    assert payment is not None
    assert payment.razorpay_payment_id == "pay_captured_1"
    assert payment.status == PaymentStatus.paid
