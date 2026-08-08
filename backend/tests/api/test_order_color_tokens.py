"""Color token assignment + order tags API tests."""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import ColorToken, LaundryStatus, OrderStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.order import Order
from app.models.user import User
from app.services.color_token_service import COLOR_TOKEN_PALETTE_ORDER, ColorTokenService, format_token_code

pytestmark = pytest.mark.asyncio


async def _seed_partner_laundry(
    session: AsyncSession,
) -> tuple[User, Laundry, LaundryService, str]:
    partner = User(
        email=f"token.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Token Test Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Token Test Laundry",
        slug=f"token-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="12 Token Road, Koramangala, 560034",
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


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_walk_in_create_assigns_color_token(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, laundry, service, token = await _seed_partner_laundry(db_session)

    response = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Token Customer",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["color_token"] == ColorToken.red.value
    assert body["token_day_number"] == 1
    assert body["token_code"] == "R-1"

    order = (
        await db_session.execute(select(Order).where(Order.id == UUID(body["id"])))
    ).scalar_one()
    assert order.color_token == ColorToken.red
    assert order.token_assigned_on is not None
    assert order.laundry_id == laundry.id


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_token_day_number_unique_per_laundry_day(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    codes: list[str] = []
    numbers: list[int] = []
    for i in range(3):
        response = await client.post(
            "/api/v1/partner/walk-in-orders",
            headers=_partner_headers(token),
            json={
                "customer_name": f"Cust {i}",
                "customer_phone": f"+91987654321{i}",
                "items": [{"service_id": str(service.id), "quantity": 1}],
            },
        )
        assert response.status_code == 201
        body = response.json()["data"]
        codes.append(body["token_code"])
        numbers.append(body["token_day_number"])

    assert numbers == [1, 2, 3]
    assert len(set(codes)) == 3


async def test_least_used_color_prefers_empty_palette(
    db_session: AsyncSession,
) -> None:
    _partner, laundry, _service, _token = await _seed_partner_laundry(db_session)
    svc = ColorTokenService(db_session)

    # Seed one active red bag so blue should win next.
    from datetime import UTC, datetime, timedelta

    from app.models.enums import OrderSource
    from app.services.color_token_service import ist_today

    existing = Order(
        laundry_id=laundry.id,
        order_source=OrderSource.walk_in,
        customer_name="Existing",
        customer_phone="+919111111111",
        status=OrderStatus.confirmed,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        color_token=ColorToken.red,
        token_code="R-1",
        token_day_number=1,
        token_assigned_on=ist_today(),
        pickup_at=datetime.now(UTC),
        delivery_at=datetime.now(UTC) + timedelta(days=1),
        subtotal_inr=Decimal("100"),
        delivery_fee_inr=Decimal("0"),
        cgst_inr=Decimal("9"),
        sgst_inr=Decimal("9"),
        total_inr=Decimal("118"),
    )
    db_session.add(existing)
    await db_session.flush()

    assignment = await svc.allocate(laundry.id)
    assert assignment.color_token == ColorToken.blue
    assert assignment.token_code == format_token_code(ColorToken.blue, 2)
    assert COLOR_TOKEN_PALETTE_ORDER[0] == ColorToken.red


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_order_tags_json_and_print_html(
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
            "customer_name": "Priya Sharma",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )
    assert create.status_code == 201
    order_id = create.json()["data"]["id"]
    token_code = create.json()["data"]["token_code"]

    tags = await client.get(
        f"/api/v1/partner/orders/{order_id}/tags",
        headers=_partner_headers(token),
    )
    assert tags.status_code == 200
    data = tags.json()["data"]
    assert data["token_code"] == token_code
    assert data["customer_phone_last4"] == "3210"
    assert data["piece_count"] == 2
    assert data["tags"][0]["kind"] == "bag_master"
    assert len(data["tags"]) == 2  # bag + one line

    per_piece = await client.get(
        f"/api/v1/partner/orders/{order_id}/tags",
        headers=_partner_headers(token),
        params={"per_piece": True},
    )
    assert per_piece.status_code == 200
    assert len(per_piece.json()["data"]["tags"]) == 3  # bag + 2 pieces

    html = await client.get(
        f"/api/v1/partner/orders/{order_id}/tags/print",
        headers=_partner_headers(token),
    )
    assert html.status_code == 200
    assert "text/html" in html.headers["content-type"]
    assert token_code in html.text
    assert "58mm" in html.text or "54mm" in html.text
