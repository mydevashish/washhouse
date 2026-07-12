"""Offline booking mode — public config and online order gate."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user_address import UserAddress
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def _seed_customer_order_context(session: AsyncSession) -> tuple[User, Laundry, LaundryService, UserAddress, str]:
    customer = User(
        email=f"offline.customer.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Offline Test Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    session.add(customer)
    await session.flush()

    partner = User(
        email=f"offline.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Offline Test Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Offline Test Laundry",
        slug=f"offline-test-{uuid4().hex[:8]}",
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

    address = UserAddress(
        user_id=customer.id,
        label="Home",
        line1="42 Customer Lane",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
        is_default=True,
    )
    session.add(address)
    await session.flush()

    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)
    return customer, laundry, service, address, token


def _customer_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_public_config_reports_offline_mode(client: AsyncClient) -> None:
    response = await client.get("/api/v1/config")

    assert response.status_code == 200
    assert response.json()["data"]["online_booking_enabled"] is False


@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_public_config_reports_online_mode(client: AsyncClient) -> None:
    response = await client.get("/api/v1/config")

    assert response.status_code == 200
    assert response.json()["data"]["online_booking_enabled"] is True


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_create_online_order_rejected_when_offline(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _customer, laundry, service, address, token = await _seed_customer_order_context(db_session)
    now = datetime.now(UTC)
    pickup = now + timedelta(days=1)
    delivery = now + timedelta(days=2)

    response = await client.post(
        "/api/v1/orders",
        headers=_customer_headers(token),
        json={
            "laundry_id": str(laundry.id),
            "address_id": str(address.id),
            "pickup_at": pickup.isoformat(),
            "delivery_at": delivery.isoformat(),
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )

    assert response.status_code == 422
    assert "not available" in response.json()["error"]["message"].lower()
