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

    # Enqueue runs on a daemon thread (BUG-020) — poll briefly instead of asserting immediately.
    import time

    deadline = time.monotonic() + 2.0
    while time.monotonic() < deadline and mock_whatsapp_task.delay.call_count < 1:
        time.sleep(0.05)
    mock_whatsapp_task.delay.assert_called_once_with(body["id"], OrderStatus.confirmed.value)

    order_id = UUID(body["id"])
    result = await db_session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one()
    assert order.order_source == OrderSource.walk_in
    assert order.customer_phone == "+919876543210"


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_create_does_not_block_when_celery_broker_hangs(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """BUG-2026-07-28-020: Redis/Celery hang must not stall walk-in HTTP response."""
    import time

    def _slow_delay(*_args: object, **_kwargs: object) -> None:
        time.sleep(30)

    mock_whatsapp_task.delay = _slow_delay
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    started = time.perf_counter()
    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Fast Path Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    elapsed = time.perf_counter() - started

    assert response.status_code == 201, response.text
    assert elapsed < 5.0, f"walk-in create blocked for {elapsed:.1f}s (expected <5s)"


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
    orders = list_response.json()["data"]["items"]
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
    headers = _partner_headers(token)

    inventory = await client.put(
        f"/api/v1/partner/orders/{order_id}/inventory-verification",
        headers=headers,
        json={
            "items": {
                "shirts": 1,
                "trousers": 0,
                "sarees": 0,
                "jackets": 0,
                "bedsheets": 0,
                "blankets": 0,
                "curtains": 0,
                "other": 0,
            },
        },
    )
    assert inventory.status_code == 200

    response = await client.patch(
        f"/api/v1/partner/orders/{order_id}/status",
        headers=headers,
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
    headers = _partner_headers(token)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=headers,
        json={
            "customer_name": "Full Flow Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]
    mock_whatsapp_task.delay.assert_called_once_with(order_id, OrderStatus.confirmed.value)

    inventory = await client.put(
        f"/api/v1/partner/orders/{order_id}/inventory-verification",
        headers=headers,
        json={
            "items": {
                "shirts": 1,
                "trousers": 0,
                "sarees": 0,
                "jackets": 0,
                "bedsheets": 0,
                "blankets": 0,
                "curtains": 0,
                "other": 0,
            },
        },
    )
    assert inventory.status_code == 200

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
async def test_walk_in_requires_inventory_not_pickup_photos(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Walk-in skips pickup photos but must record inventory before starting washing."""
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)
    headers = _partner_headers(token)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=headers,
        json={
            "customer_name": "No Pickup Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]

    blocked = await client.patch(
        f"/api/v1/partner/orders/{order_id}/status",
        headers=headers,
        json={"status": OrderStatus.washing.value},
    )
    assert blocked.status_code == 422
    assert "inventory" in blocked.json()["error"]["message"].lower()

    inventory = await client.put(
        f"/api/v1/partner/orders/{order_id}/inventory-verification",
        headers=headers,
        json={
            "items": {
                "shirts": 1,
                "trousers": 0,
                "sarees": 0,
                "jackets": 0,
                "bedsheets": 0,
                "blankets": 0,
                "curtains": 0,
                "other": 0,
            },
        },
    )
    assert inventory.status_code == 200

    for status in (OrderStatus.washing, OrderStatus.ready, OrderStatus.delivered):
        response = await client.patch(
            f"/api/v1/partner/orders/{order_id}/status",
            headers=headers,
            json={"status": status.value},
        )
        assert response.status_code == 200


@patch("app.services.order_events.publish_order_status_update", new_callable=AsyncMock)
@patch("app.services.notifications.whatsapp.get_whatsapp_provider")
async def test_send_order_status_whatsapp_uses_provider(
    mock_get_provider: MagicMock,
    _mock_publish: AsyncMock,
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

    # Task opens its own session — reuse the test session so flushed rows are visible.
    session_cm = MagicMock()
    session_cm.__aenter__ = AsyncMock(return_value=db_session)
    session_cm.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("app.db.session.AsyncSessionLocal", return_value=session_cm),
        patch(
            "app.services.notifications.dispatch.is_channel_enabled",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        await _send_order_status_whatsapp(order.id, OrderStatus.confirmed)

    mock_provider.send_template.assert_awaited_once()
    call_args = mock_provider.send_template.await_args
    assert call_args.args[0] == "+919900011122"
    assert call_args.args[1] == "order_received_detailed"
    variables = call_args.args[2]
    assert variables["customer_name"] == "WhatsApp Test"
    assert variables["tracking_code"] == order.tracking_code
    assert variables["laundry_name"] == laundry.name
    assert "items_summary" in variables
    assert variables["bag_token"].startswith("R-")


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_create_walk_in_order_from_catalog_item(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Cloth Wall path: catalog_item_id + offered price → order lines via service bridge."""
    from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
    from app.models.enums import CatalogCategory, CatalogUnit

    mock_whatsapp_task.delay = MagicMock()
    _partner, laundry, _service, token = await _seed_partner_laundry(db_session)

    shirt = PlatformCatalogItem(
        slug=f"men-shirt-{uuid4().hex[:8]}",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    db_session.add(shirt)
    await db_session.flush()
    db_session.add(
        LaundryItemPrice(
            laundry_id=laundry.id,
            catalog_item_id=shirt.id,
            dry_clean_inr=Decimal("69.00"),
            press_inr=Decimal("15.00"),
            is_offered=True,
        ),
    )
    await db_session.flush()

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Cloth Wall Customer",
            "customer_phone": "+919811122233",
            "items": [
                {
                    "catalog_item_id": str(shirt.id),
                    "process": "dry_clean",
                    "quantity": 2,
                },
            ],
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()["data"]
    assert body["customer_name"] == "Cloth Wall Customer"
    assert len(body["items"]) == 1
    assert body["items"][0]["quantity"] == 2
    assert "Shirt" in body["items"][0]["service_name"]
    assert Decimal(body["subtotal_inr"]) == Decimal("138.00")


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_create_walk_in_order_from_garment_item(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Cloth Wall path: garment_item_id + process → order lines via service bridge."""
    from app.models.enums import GarmentCategory, GarmentServiceType
    from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate

    mock_whatsapp_task.delay = MagicMock()
    _partner, laundry, _service, token = await _seed_partner_laundry(db_session)

    shirt = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.men,
        name="T Shirt",
        garment_code="TF",
        is_visible=True,
    )
    db_session.add(shirt)
    await db_session.flush()
    db_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=shirt.id,
            service_type=GarmentServiceType.dry_cleaning,
            price_inr=Decimal("59.00"),
        ),
    )
    db_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=shirt.id,
            service_type=GarmentServiceType.steam_press,
            price_inr=Decimal("15.00"),
        ),
    )
    await db_session.flush()

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Garment Wall Customer",
            "customer_phone": "+919811122244",
            "items": [
                {
                    "garment_item_id": str(shirt.id),
                    "process": "dry_clean",
                    "quantity": 2,
                },
            ],
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()["data"]
    assert body["customer_name"] == "Garment Wall Customer"
    assert len(body["items"]) == 1
    assert body["items"][0]["quantity"] == 2
    assert "T Shirt" in body["items"][0]["service_name"]
    assert Decimal(body["subtotal_inr"]) == Decimal("118.00")


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_create_walk_in_order_allows_small_counter_total_below_online_min(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Walk-in counter orders are not blocked by the online ₹99 minimum."""
    from app.models.enums import GarmentCategory, GarmentServiceType
    from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate

    mock_whatsapp_task.delay = MagicMock()
    _partner, laundry, _service, token = await _seed_partner_laundry(db_session)

    shirt = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.men,
        name="T Shirt",
        garment_code="TS",
        is_visible=True,
    )
    db_session.add(shirt)
    await db_session.flush()
    db_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=shirt.id,
            service_type=GarmentServiceType.steam_press,
            price_inr=Decimal("15.00"),
        ),
    )
    await db_session.flush()

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Small Walk-in",
            "customer_phone": "+919811122255",
            "items": [
                {
                    "garment_item_id": str(shirt.id),
                    "process": "press",
                    "quantity": 1,
                },
            ],
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()["data"]
    assert Decimal(body["total_inr"]) < Decimal("99.00")


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_orders_list_paginated_default_page_size(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, laundry, service, token = await _seed_partner_laundry(db_session)
    for i in range(12):
        create = await client.post(
            "/api/v1/partner/walk-in-orders",
            headers=_partner_headers(token),
            json={
                "customer_name": f"Page Customer {i:02d}",
                "customer_phone": f"+9198{uuid4().hex[:8]}",
                "items": [{"service_id": str(service.id), "quantity": 1}],
            },
        )
        assert create.status_code == 201, create.text

    listed = await client.get("/api/v1/partner/walk-in-orders", headers=_partner_headers(token))
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_records"] >= 12
    assert len(body["items"]) == 10
    assert body["has_next"] is True

    bad = await client.get(
        "/api/v1/partner/walk-in-orders?page_size=15",
        headers=_partner_headers(token),
    )
    assert bad.status_code == 200
    assert bad.json()["data"]["page_size"] == 10

    searched = await client.get(
        "/api/v1/partner/walk-in-orders?search=Page%20Customer%2003",
        headers=_partner_headers(token),
    )
    assert searched.status_code == 200
    assert searched.json()["data"]["total_records"] >= 1
    _ = laundry  # laundry used for ownership only
