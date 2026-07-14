"""Contact API — guest access in offline booking mode."""

from __future__ import annotations

from unittest.mock import patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.storefront import LaundryStorefront
from app.models.user import User

pytestmark = pytest.mark.asyncio

CONTACT_PHONE = "+91 98765 43210"
WHATSAPP_NUMBER = "+91 98765 43211"


async def _seed_laundry_with_storefront(session: AsyncSession) -> tuple[Laundry, User]:
    partner = User(
        email=f"contact.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Contact Test Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Contact Test Laundry",
        slug=f"contact-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="12 Test Road, Koramangala, 560034",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    session.add(
        LaundryStorefront(
            laundry_id=laundry.id,
            template_id="premium",
            contact_phone=CONTACT_PHONE,
            whatsapp_number=WHATSAPP_NUMBER,
            show_call=True,
            show_whatsapp=True,
            show_callback=True,
            is_published=True,
        ),
    )
    await session.flush()
    return laundry, partner


async def _seed_customer(session: AsyncSession) -> tuple[User, str]:
    customer = User(
        email=f"contact.customer.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Contact Test Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    session.add(customer)
    await session.flush()
    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)
    return customer, token


def _customer_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_guest_contact_returns_phone_in_offline_mode(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["offline_booking_mode"] is True
    assert data["requires_login"] is False
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True
    assert data["show_callback"] is False
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_number"] == WHATSAPP_NUMBER
    assert data["whatsapp_url"] is not None
    assert "wa.me" in data["whatsapp_url"]


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_guest_track_call_and_whatsapp_allowed_in_offline_mode(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)

    for event_type in ("call_click", "whatsapp_click"):
        response = await client.post(
            f"/api/v1/laundries/{laundry.id}/contact/track",
            json={"event_type": event_type, "source": "test"},
        )
        assert response.status_code == 200, response.text
        body = response.json()["data"]
        assert body["requires_login"] is False
        assert body["phone"] == CONTACT_PHONE
        assert body["whatsapp_url"] is not None


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_guest_callback_request_rejected_in_offline_mode(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)

    response = await client.post(
        f"/api/v1/laundries/{laundry.id}/contact/track",
        json={"event_type": "callback_request", "source": "test"},
    )

    assert response.status_code == 403


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_signed_in_customer_contact_in_offline_mode(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)
    _customer, token = await _seed_customer(db_session)

    response = await client.get(
        f"/api/v1/laundries/{laundry.id}/contact",
        headers=_customer_headers(token),
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_login"] is False
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_url"] is not None


@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_guest_contact_requires_login_when_online_booking_enabled(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["offline_booking_mode"] is False
    assert data["requires_login"] is True
    assert data["contact_available"] is True
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True
    assert data["show_callback"] is False
    assert data["phone"] is None
    assert data["whatsapp_number"] is None
    assert data["whatsapp_url"] is None


@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_signed_in_customer_contact_when_online_booking_enabled(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry, _ = await _seed_laundry_with_storefront(db_session)
    _customer, token = await _seed_customer(db_session)

    response = await client.get(
        f"/api/v1/laundries/{laundry.id}/contact",
        headers=_customer_headers(token),
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["offline_booking_mode"] is False
    assert data["requires_login"] is False
    assert data["contact_available"] is True
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True
    assert data["show_callback"] is True
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_url"] is not None
