"""Marketplace “from ₹” aggregate API tests."""

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
from app.core.security import hash_password
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
async def marketplace_client() -> AsyncIterator[tuple[AsyncClient, AsyncSession]]:
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


async def _seed_approved_laundry(session: AsyncSession, *, slug_suffix: str) -> Laundry:
    partner = User(
        email=f"mkt.from.{slug_suffix}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Marketplace From Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name=f"Marketplace Laundry {slug_suffix}",
        slug=f"mkt-from-{slug_suffix}",
        city="Bengaluru",
        address_line="1 Aggregate Road",
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
    curtain = PlatformCatalogItem(
        slug=f"household-curtain-{uuid4().hex[:8]}",
        name="Curtain (per panel)",
        category=CatalogCategory.household,
        unit=CatalogUnit.panel,
        suggested_price_inr=None,
        sort_order=99,
    )
    session.add_all([shirt, wash_fold, curtain])
    await session.flush()
    return {"shirt": shirt, "wash_fold": wash_fold, "curtain": curtain}


async def test_marketplace_from_falls_back_to_suggested(
    marketplace_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = marketplace_client
    items = await _seed_catalog(session)

    response = await client.get("/api/v1/catalog/marketplace-from")
    assert response.status_code == 200
    assert "public, max-age=" in response.headers.get("cache-control", "")
    body = response.json()["data"]
    assert body["item_count"] == 2  # curtain deferred omitted
    by_slug = {row["slug"]: row for row in body["items"]}
    shirt = by_slug[items["shirt"].slug]
    assert shirt["source"] == "suggested"
    assert shirt["from_dry_clean_inr"] == "69.00"
    assert shirt["from_press_inr"] == "15.00"
    assert shirt["from_dry_clean_paise"] == 6900
    wash = by_slug[items["wash_fold"].slug]
    assert wash["source"] == "suggested"
    assert wash["from_price_inr"] == "79.00"
    assert items["curtain"].slug not in by_slug


async def test_marketplace_from_uses_min_across_approved_partners(
    marketplace_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = marketplace_client
    items = await _seed_catalog(session)
    laundry_a = await _seed_approved_laundry(session, slug_suffix=uuid4().hex[:8])
    laundry_b = await _seed_approved_laundry(session, slug_suffix=uuid4().hex[:8])

    session.add_all(
        [
            LaundryItemPrice(
                laundry_id=laundry_a.id,
                catalog_item_id=items["shirt"].id,
                dry_clean_inr=Decimal("89.00"),
                press_inr=Decimal("25.00"),
                is_offered=True,
            ),
            LaundryItemPrice(
                laundry_id=laundry_b.id,
                catalog_item_id=items["shirt"].id,
                dry_clean_inr=Decimal("69.00"),
                press_inr=Decimal("18.00"),
                is_offered=True,
            ),
            LaundryItemPrice(
                laundry_id=laundry_a.id,
                catalog_item_id=items["wash_fold"].id,
                price_inr=Decimal("99.00"),
                is_offered=True,
            ),
        ],
    )
    await session.flush()

    response = await client.get("/api/v1/catalog/marketplace-from")
    assert response.status_code == 200
    body = response.json()["data"]
    by_slug = {row["slug"]: row for row in body["items"]}
    shirt = by_slug[items["shirt"].slug]
    assert shirt["source"] == "aggregate"
    assert shirt["from_dry_clean_inr"] == "69.00"
    assert shirt["from_press_inr"] == "18.00"
    wash = by_slug[items["wash_fold"].slug]
    assert wash["source"] == "aggregate"
    assert wash["from_price_inr"] == "99.00"


async def test_marketplace_from_ignores_disabled_and_unapproved(
    marketplace_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = marketplace_client
    items = await _seed_catalog(session)
    approved = await _seed_approved_laundry(session, slug_suffix=uuid4().hex[:8])

    partner = User(
        email=f"pending.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Pending Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    pending = Laundry(
        owner_user_id=partner.id,
        name="Pending Laundry",
        slug=f"pending-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="2 Pending Road",
        status=LaundryStatus.pending_approval,
    )
    session.add(pending)
    await session.flush()

    session.add_all(
        [
            LaundryItemPrice(
                laundry_id=approved.id,
                catalog_item_id=items["shirt"].id,
                dry_clean_inr=Decimal("50.00"),
                press_inr=Decimal("10.00"),
                is_offered=False,
            ),
            LaundryItemPrice(
                laundry_id=pending.id,
                catalog_item_id=items["shirt"].id,
                dry_clean_inr=Decimal("40.00"),
                press_inr=Decimal("5.00"),
                is_offered=True,
            ),
        ],
    )
    await session.flush()

    response = await client.get("/api/v1/catalog/marketplace-from")
    assert response.status_code == 200
    body = response.json()["data"]
    shirt = next(row for row in body["items"] if row["slug"] == items["shirt"].slug)
    assert shirt["source"] == "suggested"
    assert shirt["from_dry_clean_inr"] == "69.00"


async def test_marketplace_from_category_filter(
    marketplace_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = marketplace_client
    await _seed_catalog(session)

    response = await client.get("/api/v1/catalog/marketplace-from?category=laundry_by_kg")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["item_count"] == 1
    assert body["items"][0]["category"] == "laundry_by_kg"
    assert body["items"][0]["from_price_inr"] == "79.00"
