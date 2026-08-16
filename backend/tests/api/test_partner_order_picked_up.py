"""Partner picked_up transition — pickup evidence + inventory gates."""

from __future__ import annotations

import io
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, OrderSource, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User

pytestmark = pytest.mark.asyncio


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _make_jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=(120, 80, 200)).save(buf, format="JPEG")
    return buf.getvalue()


def _inventory_payload(*, shirts: int = 2) -> dict:
    return {
        "items": {
            "shirts": shirts,
            "trousers": 0,
            "sarees": 0,
            "jackets": 0,
            "bedsheets": 0,
            "blankets": 0,
            "curtains": 0,
            "other": 0,
        },
    }


async def _seed_partner(session: AsyncSession) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"pickedup.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Picked Up Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Picked Up Laundry",
        slug=f"picked-up-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Partner Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


async def _seed_pickup_assigned_order(session: AsyncSession, *, laundry_id) -> Order:
    customer = User(
        email=f"pickedup.cust.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Pickup Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    session.add(customer)
    await session.flush()

    now = datetime.now(UTC)
    order = Order(
        user_id=customer.id,
        laundry_id=laundry_id,
        order_source=OrderSource.online,
        status=OrderStatus.pickup_assigned,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now + timedelta(hours=2),
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("49.00"),
        cgst_inr=Decimal("22.41"),
        sgst_inr=Decimal("22.41"),
        total_inr=Decimal("293.82"),
        payment_status=PaymentStatus.pending,
    )
    session.add(order)
    await session.flush()
    return order


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_picked_up_blocked_without_evidence_or_inventory(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _partner, laundry, token = await _seed_partner(db_session)
    order = await _seed_pickup_assigned_order(db_session, laundry_id=laundry.id)

    response = await client.patch(
        f"/api/v1/partner/orders/{order.id}/status",
        headers=_headers(token),
        json={"status": OrderStatus.picked_up.value},
    )
    assert response.status_code == 422
    assert "pickup evidence" in response.json()["error"]["message"].lower()


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_picked_up_succeeds_with_evidence_and_inventory(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _partner, laundry, token = await _seed_partner(db_session)
    order = await _seed_pickup_assigned_order(db_session, laundry_id=laundry.id)
    headers = _headers(token)

    evidence = await client.post(
        f"/api/v1/partner/orders/{order.id}/pickup-evidence",
        headers=headers,
        files={"files": ("pickup.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    assert evidence.status_code == 201

    inventory = await client.put(
        f"/api/v1/partner/orders/{order.id}/inventory-verification",
        headers=headers,
        json=_inventory_payload(),
    )
    assert inventory.status_code == 200

    response = await client.patch(
        f"/api/v1/partner/orders/{order.id}/status",
        headers=headers,
        json={"status": OrderStatus.picked_up.value},
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == OrderStatus.picked_up.value
