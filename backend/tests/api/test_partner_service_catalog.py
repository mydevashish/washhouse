"""Partner legacy service catalog API integration tests."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def _seed_partner_with_services(
    session: AsyncSession,
    *,
    count: int = 12,
) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"svc.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Service Catalog Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Service Catalog Laundry",
        slug=f"svc-catalog-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Service Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    names = [
        "Wash & Fold",
        "Wash & Iron",
        "Dry Clean Suit",
        "Steam Press",
        "Premium Laundry",
        "Express Wash",
        "Shoe Cleaning",
        "Curtain Clean",
        "Blanket Wash",
        "Starch Service",
        "Lint Remover",
        "Commercial Wash",
    ]
    categories = ["wash", "wash", "dry_clean", "press", "premium", "express", "shoe", "household", "household", "press", "care", "commercial"]

    for i in range(count):
        session.add(
            LaundryService(
                laundry_id=laundry.id,
                name=names[i % len(names)],
                category=categories[i % len(categories)],
                unit="piece",
                price_inr=Decimal(str(49 + i)),
                is_active=True,
                catalog_status="active",
                sort_order=i,
            ),
        )
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_list_services_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/partner/services")
    assert response.status_code == 401


async def test_list_services_paginated_default_page_size(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, _, token = await _seed_partner_with_services(db_session, count=12)
    headers = _headers(token)

    response = await client.get("/api/v1/partner/services", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_records"] == 12
    assert data["total_pages"] == 2
    assert data["has_next"] is True
    assert data["has_previous"] is False
    assert len(data["items"]) == 10


async def test_list_services_search_by_name(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, _, token = await _seed_partner_with_services(db_session, count=12)
    headers = _headers(token)

    response = await client.get(
        "/api/v1/partner/services",
        headers=headers,
        params={"search": "Dry Clean", "page_size": 10},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_records"] == 1
    assert data["items"][0]["name"] == "Dry Clean Suit"


async def test_list_services_page_two(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, _, token = await _seed_partner_with_services(db_session, count=12)
    headers = _headers(token)

    response = await client.get(
        "/api/v1/partner/services",
        headers=headers,
        params={"page": 2, "page_size": 10},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["page"] == 2
    assert len(data["items"]) == 2
    assert data["has_next"] is False
    assert data["has_previous"] is True
