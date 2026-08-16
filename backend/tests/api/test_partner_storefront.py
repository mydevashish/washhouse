"""Partner storefront PATCH integration tests."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.storefront import LaundryStorefront
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def _seed_partner_storefront(session: AsyncSession) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"storefront.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Storefront Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Storefront Test Laundry",
        slug=f"storefront-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Storefront Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    session.add(
        LaundryStorefront(
            laundry_id=laundry.id,
            template_id="premium",
            is_published=True,
            tagline="Original tagline",
            facilities=["Steam Iron"],
            highlights=[{"title": "Trusted", "description": "Local"}],
            gallery=[],
            machines=[],
            team=[],
            certifications=[],
            videos=[],
            completeness_score=30,
        ),
    )
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_patch_storefront_partial_update(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, _, token = await _seed_partner_storefront(db_session)
    headers = _headers(token)

    response = await client.patch(
        "/api/v1/partner/storefront",
        headers=headers,
        json={
            "tagline": "New headline",
            "facilities": [],
            "pickup_radius_km": "6.5",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["tagline"] == "New headline"
    assert data["facilities"] == []
    assert str(data["pickup_radius_km"]) == "6.50"


async def test_patch_storefront_rejects_read_only_extra_fields(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, laundry, token = await _seed_partner_storefront(db_session)
    headers = _headers(token)

    response = await client.patch(
        "/api/v1/partner/storefront",
        headers=headers,
        json={
            "tagline": "Safe update",
            "laundry_id": str(laundry.id),
            "completeness_score": 100,
            "approval_status": "rejected",
        },
    )
    assert response.status_code == 422
