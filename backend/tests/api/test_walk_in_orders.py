"""Walk-in order API integration tests."""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, OrderSource, OrderStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.order import Order
from app.models.user import User
from app.tasks.order_notifications import _send_order_status_whatsapp

pytestmark = pytest.mark.asyncio


async def _seed_partner_laundry(
    session: AsyncSession,
) -> tuple[User, Laundry, LaundryService, str]:
    partner = User(
        email=f"walkin.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Walk-in Test Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Walk-in Test Laundry",
        slug=f"walk-in-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="12 Test Road, Koramangala, 560034",
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
        price_inr=Decimal("100"),
        is_active=True,
        catalog_status="active",
    )
    session.add(service)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, service, token


def _partner_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_walk_in_orders_require_partner_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        json={
            "customer_name": "Priya",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(uuid4()), "quantity": 1}],
        },
    )
    assert response.status_code == 401


async def test_create_walk_in_order_rejects_invalid_phone(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Invalid Phone",
            "customer_phone": "not-a-phone",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )

    assert response.status_code == 422


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_create_walk_in_order_schedules_whatsapp(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Walk-in Customer",
            "customer_phone": "+919876543210",
            "notes": "Same-day express",
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["status"] == OrderStatus.confirmed.value
    assert body["customer_name"] == "Walk-in Customer"
    assert body["customer_phone"] == "+919876543210"
    assert body["tracking_code"].startswith("DLM")
    assert len(body["items"]) == 1
    assert Decimal(body["total_inr"]) > 0

    mock_whatsapp_task.delay.assert_called_once_with(body["id"], OrderStatus.confirmed.value)

    order_id = UUID(body["id"])
    result = await db_session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one()
    assert order.order_source == OrderSource.walk_in
    assert order.customer_phone == "+919876543210"


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_order_appears_in_partner_orders_list(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "List Test Customer",
            "customer_phone": "+919955566677",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]

    list_response = await client.get(
        "/api/v1/partner/orders",
        headers=_partner_headers(token),
    )
    assert list_response.status_code == 200
    orders = list_response.json()["data"]
    match = next((row for row in orders if row["id"] == order_id), None)
    assert match is not None
    assert match["order_source"] == OrderSource.walk_in.value
    assert match["customer_phone"] == "+919955566677"
    assert match["customer_name"] == "List Test Customer"


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_status_update_schedules_whatsapp(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Status Test",
            "customer_phone": "+919811122233",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]
    mock_whatsapp_task.delay.reset_mock()

    response = await client.patch(
        f"/api/v1/partner/orders/{order_id}/status",
        headers=_partner_headers(token),
        json={"status": OrderStatus.washing.value},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == OrderStatus.washing.value
    mock_whatsapp_task.delay.assert_called_once_with(order_id, OrderStatus.washing.value)


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_full_status_progression_schedules_whatsapp(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Walk-in: confirmed → washing → ready → delivered; WhatsApp at each notify status."""
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Full Flow Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]
    mock_whatsapp_task.delay.assert_called_once_with(order_id, OrderStatus.confirmed.value)

    for status in (OrderStatus.washing, OrderStatus.ready, OrderStatus.delivered):
        mock_whatsapp_task.delay.reset_mock()
        response = await client.patch(
            f"/api/v1/partner/orders/{order_id}/status",
            headers=_partner_headers(token),
            json={"status": status.value},
        )
        assert response.status_code == 200, f"Failed advancing to {status.value}"
        assert response.json()["data"]["status"] == status.value
        mock_whatsapp_task.delay.assert_called_once_with(order_id, status.value)

    bad = await client.patch(
        f"/api/v1/partner/orders/{order_id}/status",
        headers=_partner_headers(token),
        json={"status": OrderStatus.ironing.value},
    )
    assert bad.status_code == 409


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_skips_pickup_inventory_requirements(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Walk-in orders never enter picked_up; pickup evidence and inventory are not required."""
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "No Pickup Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]

    for status in (OrderStatus.washing, OrderStatus.ready, OrderStatus.delivered):
        response = await client.patch(
            f"/api/v1/partner/orders/{order_id}/status",
            headers=_partner_headers(token),
            json={"status": status.value},
        )
        assert response.status_code == 200


@patch("app.services.notifications.whatsapp.get_whatsapp_provider")
async def test_send_order_status_whatsapp_uses_provider(
    mock_get_provider: MagicMock,
    db_session: AsyncSession,
) -> None:
    mock_provider = MagicMock()
    mock_provider.send_template = AsyncMock()
    mock_get_provider.return_value = mock_provider

    _partner, laundry, service, _token = await _seed_partner_laundry(db_session)

    from app.services.walk_in_order_service import WalkInOrderService

    order = await WalkInOrderService(db_session).create(
        _partner.id,
        customer_name="WhatsApp Test",
        customer_phone="+919900011122",
        items=[{"service_id": service.id, "quantity": 1}],
    )
    assert order.order_source == OrderSource.walk_in

    await _send_order_status_whatsapp(order.id, OrderStatus.confirmed)

    mock_provider.send_template.assert_awaited_once()
    call_args = mock_provider.send_template.await_args
    assert call_args.args[0] == "+919900011122"
    assert call_args.args[1] == "order_received"
    variables = call_args.args[2]
    assert variables["customer_name"] == "WhatsApp Test"
    assert variables["tracking_code"] == order.tracking_code
    assert variables["laundry_name"] == laundry.name
