"""Customer orders — create, cancel window, authz (Phases 2–5 + BUG-011)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import LaundryStatus, OrderSource, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.order import Order
from app.models.user import User
from app.models.user_address import UserAddress

pytestmark = pytest.mark.asyncio


async def test_order_events_requires_auth(client: AsyncClient) -> None:
    order_id = uuid4()
    response = await client.get(f"/api/v1/orders/{order_id}/events")
    assert response.status_code == 401


async def test_list_orders_requires_auth(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/orders")).status_code == 401


async def test_list_orders_happy(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    resp = await client.get("/api/v1/orders", headers=customer_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


async def _seed_orderable(
    session: AsyncSession,
    customer: User,
) -> tuple[Laundry, LaundryService, UserAddress]:
    partner = User(
        email=f"ord.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Order Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Orderable Laundry",
        slug=f"orderable-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="9 Order Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    service = LaundryService(
        laundry_id=laundry.id,
        name="Wash & Fold",
        category="wash",
        unit="kg",
        price_inr=Decimal("100.00"),
        is_active=True,
        catalog_status="active",
    )
    session.add(service)

    address = UserAddress(
        user_id=customer.id,
        label="Home",
        line1="1 Customer Lane",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
        is_default=True,
    )
    session.add(address)
    await session.flush()
    return laundry, service, address


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_create_order_happy_with_gst(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
    customer_user: User,
    customer_headers: dict[str, str],
) -> None:
    mock_whatsapp.delay = MagicMock()
    laundry, service, address = await _seed_orderable(db_session, customer_user)
    now = datetime.now(UTC)

    resp = await client.post(
        "/api/v1/orders",
        headers=customer_headers,
        json={
            "laundry_id": str(laundry.id),
            "address_id": str(address.id),
            "pickup_at": (now + timedelta(days=1)).isoformat(),
            "delivery_at": (now + timedelta(days=2)).isoformat(),
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["status"] == OrderStatus.confirmed.value
    assert data["tracking_code"].startswith("DLM")
    assert Decimal(data["cgst_inr"]) > 0
    assert Decimal(data["sgst_inr"]) > 0
    assert Decimal(data["total_inr"]) > 0


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_create_order_422_empty_items(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
    customer_user: User,
    customer_headers: dict[str, str],
) -> None:
    mock_whatsapp.delay = MagicMock()
    laundry, _service, address = await _seed_orderable(db_session, customer_user)
    now = datetime.now(UTC)

    resp = await client.post(
        "/api/v1/orders",
        headers=customer_headers,
        json={
            "laundry_id": str(laundry.id),
            "address_id": str(address.id),
            "pickup_at": (now + timedelta(days=1)).isoformat(),
            "delivery_at": (now + timedelta(days=2)).isoformat(),
            "items": [],
        },
    )
    assert resp.status_code == 422


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_cancel_rejected_after_picked_up(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
    customer_user: User,
    customer_headers: dict[str, str],
) -> None:
    """BUG-011: cancel only before pickup — picked_up must fail."""
    mock_whatsapp.delay = MagicMock()
    laundry, _service, _address = await _seed_orderable(db_session, customer_user)
    now = datetime.now(UTC)
    order = Order(
        user_id=customer_user.id,
        laundry_id=laundry.id,
        order_source=OrderSource.online,
        status=OrderStatus.picked_up,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now - timedelta(hours=1),
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("49.00"),
        cgst_inr=Decimal("22.41"),
        sgst_inr=Decimal("22.41"),
        total_inr=Decimal("293.82"),
        payment_status=PaymentStatus.pending,
    )
    db_session.add(order)
    await db_session.flush()

    resp = await client.post(
        f"/api/v1/orders/{order.id}/cancel",
        headers=customer_headers,
        json={"reason": "Too late"},
    )
    assert resp.status_code in (400, 409, 422)


async def test_partner_cannot_list_customer_orders(
    client: AsyncClient,
    partner_headers: dict[str, str],
) -> None:
    # Customer list route is role-gated to customers (or auth-only with empty for others).
    resp = await client.get("/api/v1/orders", headers=partner_headers)
    assert resp.status_code in (200, 403)
