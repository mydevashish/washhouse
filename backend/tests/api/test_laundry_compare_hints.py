"""API tests: laundry list/search include owner-set compare price hints."""

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
async def compare_client() -> AsyncIterator[tuple[AsyncClient, AsyncSession]]:
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


async def _seed_laundry(session: AsyncSession, *, name: str) -> Laundry:
    partner = User(
        email=f"compare.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Compare Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name=name,
        slug=f"compare-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Compare Road",
        status=LaundryStatus.approved,
        is_verified=True,
        avg_rating=Decimal("4.50"),
        review_count=3,
    )
    session.add(laundry)
    await session.flush()
    return laundry


async def _seed_compare_catalog(session: AsyncSession) -> dict[str, PlatformCatalogItem]:
    from sqlalchemy import select

    existing = {
        row.slug: row
        for row in (
            await session.scalars(
                select(PlatformCatalogItem).where(
                    PlatformCatalogItem.slug.in_(["kg-wash-fold", "men-shirt-tshirt"]),
                    PlatformCatalogItem.deleted_at.is_(None),
                ),
            )
        ).all()
    }
    if "kg-wash-fold" not in existing:
        wash_fold = PlatformCatalogItem(
            slug="kg-wash-fold",
            name="Wash & Fold",
            category=CatalogCategory.laundry_by_kg,
            unit=CatalogUnit.kg,
            suggested_price_inr=Decimal("79.00"),
            sort_order=10,
        )
        session.add(wash_fold)
        existing["kg-wash-fold"] = wash_fold
    if "men-shirt-tshirt" not in existing:
        shirt = PlatformCatalogItem(
            slug="men-shirt-tshirt",
            name="Shirt / T-shirt",
            category=CatalogCategory.men,
            unit=CatalogUnit.piece,
            suggested_dry_clean_inr=Decimal("69.00"),
            suggested_press_inr=Decimal("15.00"),
            sort_order=10,
        )
        session.add(shirt)
        existing["men-shirt-tshirt"] = shirt
    await session.flush()
    return {"wash_fold": existing["kg-wash-fold"], "shirt": existing["men-shirt-tshirt"]}


async def test_list_includes_compare_hints_when_offered(
    compare_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = compare_client
    laundry = await _seed_laundry(session, name="Compare Priced Laundry")
    catalog = await _seed_compare_catalog(session)
    session.add_all(
        [
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=catalog["wash_fold"].id,
                price_inr=Decimal("85.00"),
                is_offered=True,
            ),
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=catalog["shirt"].id,
                dry_clean_inr=Decimal("72.00"),
                press_inr=Decimal("18.00"),
                is_offered=True,
            ),
        ],
    )
    await session.flush()

    response = await client.get("/api/v1/laundries")
    assert response.status_code == 200
    rows = response.json()["data"]
    match = next(r for r in rows if r["id"] == str(laundry.id))
    assert match["wash_fold_from_inr"] == "85.00"
    assert match["shirt_dry_clean_from_inr"] == "72.00"
    assert match["start_price_inr"] == "72.00"
    assert match["start_price_paise"] == 7200


async def test_list_omits_hints_when_not_offered(
    compare_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = compare_client
    laundry = await _seed_laundry(session, name="Compare Empty Laundry")
    await _seed_compare_catalog(session)

    response = await client.get("/api/v1/laundries")
    assert response.status_code == 200
    rows = response.json()["data"]
    match = next(r for r in rows if r["id"] == str(laundry.id))
    assert match["wash_fold_from_inr"] is None
    assert match["shirt_dry_clean_from_inr"] is None
    assert match["start_price_inr"] is None


async def test_list_ignores_disabled_compare_items(
    compare_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = compare_client
    laundry = await _seed_laundry(session, name="Compare Disabled Laundry")
    catalog = await _seed_compare_catalog(session)
    session.add(
        LaundryItemPrice(
            laundry_id=laundry.id,
            catalog_item_id=catalog["wash_fold"].id,
            price_inr=Decimal("99.00"),
            is_offered=False,
        ),
    )
    await session.flush()

    response = await client.get("/api/v1/laundries")
    assert response.status_code == 200
    match = next(r for r in response.json()["data"] if r["id"] == str(laundry.id))
    assert match["wash_fold_from_inr"] is None
    assert match["start_price_inr"] is None
