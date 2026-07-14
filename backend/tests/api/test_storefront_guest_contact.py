"""Additional contact API coverage for approved laundries in offline mode."""

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


async def _seed_approved_laundry_no_storefront(session: AsyncSession) -> Laundry:
    partner = User(
        email=f"offline.no-sf.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Offline No SF Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Offline No Storefront Laundry",
        slug=f"offline-no-sf-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="99 Test Lane, 560034",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return laundry


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_offline_contact_whatsapp_falls_back_to_contact_phone(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry = await _seed_approved_laundry_no_storefront(db_session)
    db_session.add(
        LaundryStorefront(
            laundry_id=laundry.id,
            template_id="premium",
            contact_phone=CONTACT_PHONE,
            whatsapp_number=None,
            show_call=True,
            show_whatsapp=True,
            is_published=True,
            approval_status="approved",
        ),
    )
    await db_session.flush()

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_number"] == CONTACT_PHONE
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_offline_contact_hidden_when_storefront_unpublished(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry = await _seed_approved_laundry_no_storefront(db_session)
    db_session.add(
        LaundryStorefront(
            laundry_id=laundry.id,
            template_id="premium",
            contact_phone=CONTACT_PHONE,
            show_call=True,
            show_whatsapp=True,
            is_published=False,
            approval_status="approved",
        ),
    )
    await db_session.flush()

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["phone"] is None
    assert data["whatsapp_number"] is None
    assert data["show_call"] is False
    assert data["show_whatsapp"] is False


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_offline_contact_show_call_for_approved_laundry_with_seeded_phone(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry = await _seed_approved_laundry_no_storefront(db_session)
    db_session.add(
        LaundryStorefront(
            laundry_id=laundry.id,
            template_id="premium",
            contact_phone=CONTACT_PHONE,
            whatsapp_number=CONTACT_PHONE,
            show_call=True,
            show_whatsapp=True,
            is_published=True,
            approval_status="approved",
        ),
    )
    await db_session.flush()

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_number"] == CONTACT_PHONE
    assert data["whatsapp_url"] is not None
    assert "wa.me" in data["whatsapp_url"]


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_offline_contact_auto_creates_storefront_without_owner_phone(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry = await _seed_approved_laundry_no_storefront(db_session)

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["offline_booking_mode"] is True
    assert data["requires_login"] is False
    assert data["show_call"] is False
    assert data["show_whatsapp"] is False


@patch.object(settings, "FEATURE_ONLINE_BOOKING", False)
async def test_offline_contact_auto_creates_storefront_with_owner_phone(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    laundry = await _seed_approved_laundry_no_storefront(db_session)
    partner = await db_session.get(User, laundry.owner_user_id)
    assert partner is not None
    partner.phone = CONTACT_PHONE
    await db_session.flush()

    response = await client.get(f"/api/v1/laundries/{laundry.id}/contact")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["offline_booking_mode"] is True
    assert data["show_call"] is True
    assert data["show_whatsapp"] is True
    assert data["phone"] == CONTACT_PHONE
    assert data["whatsapp_number"] == CONTACT_PHONE
    assert data["whatsapp_url"] is not None
