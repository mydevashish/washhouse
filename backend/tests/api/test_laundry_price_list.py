"""Public laundry price-list API tests."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_session
from app.main import app as fastapi_app
from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit, LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User

import app.models  # noqa: F401

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _disable_redis_rate_limit_middleware():
    with (
        patch.object(settings, "RATE_LIMIT_ENABLED", False),
        patch.object(settings, "CACHE_ENABLED", False),
    ):
        yield


@pytest_asyncio.fixture
async def public_price_client() -> AsyncIterator[tuple[AsyncClient, AsyncSession]]:
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://dlm:dlm_dev_password@localhost:5432/dlm_test",
    )
    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as session:

        async def _override_session() -> AsyncIterator[AsyncSession]:
            yield session

        fastapi_app.dependency_overrides[get_session] = _override_session
        transport = ASGITransport(app=fastapi_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client, session
            await session.rollback()
        fastapi_app.dependency_overrides.clear()
    await engine.dispose()


async def _seed_approved_laundry(session: AsyncSession) -> Laundry:
    partner = User(
        email=f"public.price.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Public Price Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Public Price Laundry",
        slug=f"public-price-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Public Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return laundry


async def _seed_catalog(session: AsyncSession) -> dict[str, PlatformCatalogItem]:
    shirt = PlatformCatalogItem(
        slug=f"men-shirt-{uuid4().hex[:8]}",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    wash_fold = PlatformCatalogItem(
        slug=f"kg-wash-fold-{uuid4().hex[:8]}",
        name="Wash & Fold",
        category=CatalogCategory.laundry_by_kg,
        unit=CatalogUnit.kg,
        suggested_price_inr=Decimal("79.00"),
        sort_order=10,
    )
    session.add_all([shirt, wash_fold])
    await session.flush()
    return {"shirt": shirt, "wash_fold": wash_fold}


async def test_public_price_list_empty_when_no_overrides(
    public_price_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = public_price_client
    laundry = await _seed_approved_laundry(session)
    await _seed_catalog(session)

    response = await client.get(f"/api/v1/laundries/{laundry.id}/price-list")
    assert response.status_code == 200
    assert "public, max-age=" in response.headers.get("cache-control", "")
    body = response.json()["data"]
    assert body["laundry_id"] == str(laundry.id)
    assert body["items"] == []
    assert body["item_count"] == 0
    assert body["has_published_list"] is False
    # No partner / suggested fields leaked
    assert "suggested_dry_clean_inr" not in body
    assert "offered_count" not in body


async def test_public_price_list_offered_only_omits_disabled_and_suggested(
    public_price_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = public_price_client
    laundry = await _seed_approved_laundry(session)
    items = await _seed_catalog(session)

    session.add_all(
        [
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=items["shirt"].id,
                dry_clean_inr=Decimal("75.00"),
                press_inr=Decimal("20.00"),
                is_offered=True,
            ),
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=items["wash_fold"].id,
                price_inr=Decimal("85.00"),
                is_offered=False,
            ),
        ],
    )
    await session.flush()

    response = await client.get(f"/api/v1/laundries/{laundry.id}/price-list")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["has_published_list"] is True
    assert body["item_count"] == 1
    row = body["items"][0]
    assert row["catalog_item_id"] == str(items["shirt"].id)
    assert row["name"] == "Shirt / T-shirt"
    assert row["dry_clean_inr"] == "75.00"
    assert row["press_inr"] == "20.00"
    assert row["dry_clean_paise"] == 7500
    assert row["price_mode"] == "dual"
    assert "suggested_dry_clean_inr" not in row
    assert "is_offered" not in row
    assert "has_override" not in row
    assert "allows_press" not in row


async def test_public_price_list_404_for_unknown_or_unapproved(
    public_price_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = public_price_client
    partner = User(
        email=f"pending.price.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Pending",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    pending = Laundry(
        owner_user_id=partner.id,
        name="Pending Laundry",
        slug=f"pending-price-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="2 Pending Road",
        status=LaundryStatus.pending_approval,
    )
    session.add(pending)
    await session.flush()

    assert (await client.get(f"/api/v1/laundries/{pending.id}/price-list")).status_code == 404
    assert (await client.get(f"/api/v1/laundries/{uuid4()}/price-list")).status_code == 404


async def test_partner_disable_hides_from_public_list(
    public_price_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = public_price_client
    partner = User(
        email=f"toggle.price.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Toggle Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name="Toggle Laundry",
        slug=f"toggle-price-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="3 Toggle Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    items = await _seed_catalog(session)
    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)

    put = await client.put(
        "/api/v1/partner/price-list",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "dry_clean_inr": "75.00",
                    "press_inr": "20.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert put.status_code == 200

    public = await client.get(f"/api/v1/laundries/{laundry.id}/price-list")
    assert public.status_code == 200
    assert public.json()["data"]["item_count"] == 1

    disable = await client.patch(
        f"/api/v1/partner/price-list/{items['shirt'].id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_offered": False},
    )
    assert disable.status_code == 200

    after = await client.get(f"/api/v1/laundries/{laundry.id}/price-list")
    assert after.status_code == 200
    assert after.json()["data"]["item_count"] == 0
    assert after.json()["data"]["has_published_list"] is False
