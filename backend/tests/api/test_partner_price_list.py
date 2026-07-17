"""Partner price-list API integration tests."""

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
from app.models.catalog import PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit, LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User

# Ensure catalog models are registered on Base.metadata before create_all.
import app.models  # noqa: F401

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _disable_redis_rate_limit_middleware():
    with patch.object(settings, "RATE_LIMIT_ENABLED", False):
        yield


@pytest_asyncio.fixture
async def price_list_client() -> AsyncIterator[tuple[AsyncClient, AsyncSession]]:
    """Function-scoped client+session — avoids session-engine / loop mismatch on Windows."""
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


async def _seed_partner(
    session: AsyncSession,
    *,
    email_prefix: str = "price.partner",
) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"{email_prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Price List Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Price List Laundry",
        slug=f"price-list-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Price Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


async def _seed_catalog_items(session: AsyncSession) -> dict[str, PlatformCatalogItem]:
    shirt = PlatformCatalogItem(
        slug=f"men-shirt-{uuid4().hex[:8]}",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    cap = PlatformCatalogItem(
        slug=f"men-cap-{uuid4().hex[:8]}",
        name="Cap (fabric)",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("39.00"),
        suggested_press_inr=None,
        sort_order=20,
    )
    wash_fold = PlatformCatalogItem(
        slug=f"kg-wash-fold-{uuid4().hex[:8]}",
        name="Wash & Fold",
        category=CatalogCategory.laundry_by_kg,
        unit=CatalogUnit.kg,
        suggested_price_inr=Decimal("79.00"),
        sort_order=10,
    )
    session.add_all([shirt, cap, wash_fold])
    await session.flush()
    return {"shirt": shirt, "cap": cap, "wash_fold": wash_fold}


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_price_list_requires_auth(price_list_client: tuple[AsyncClient, AsyncSession]) -> None:
    client, _session = price_list_client
    assert (await client.get("/api/v1/partner/price-list")).status_code == 401
    assert (await client.put("/api/v1/partner/price-list", json={"items": []})).status_code == 401
    assert (await client.post("/api/v1/partner/price-list/apply-suggested")).status_code == 401


async def test_customer_role_forbidden(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    customer = User(
        email=f"price.customer.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    session.add(customer)
    await session.flush()
    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)

    response = await client.get("/api/v1/partner/price-list", headers=_headers(token))
    assert response.status_code == 403


async def test_get_price_list_empty_overrides(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    response = await client.get("/api/v1/partner/price-list", headers=_headers(token))
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["offered_count"] == 0
    assert body["total_catalog_items"] >= 3
    by_id = {row["catalog_item_id"]: row for row in body["items"]}
    shirt = by_id[str(items["shirt"].id)]
    assert shirt["has_override"] is False
    assert shirt["dry_clean_inr"] is None
    assert shirt["suggested_dry_clean_inr"] == "69.00"
    assert shirt["suggested_dry_clean_paise"] == 6900
    assert shirt["allows_press"] is True
    assert shirt["price_mode"] == "dual"
    assert by_id[str(items["cap"].id)]["allows_press"] is False
    assert by_id[str(items["wash_fold"].id)]["price_mode"] == "single"


async def test_bulk_put_and_patch_happy_path(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    put = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "dry_clean_inr": "75.00",
                    "press_inr": "20.00",
                    "is_offered": True,
                },
                {
                    "catalog_item_id": str(items["wash_fold"].id),
                    "price_inr": "85.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert put.status_code == 200
    data = put.json()["data"]
    assert data["offered_count"] == 2
    by_id = {row["catalog_item_id"]: row for row in data["items"]}
    assert by_id[str(items["shirt"].id)]["dry_clean_inr"] == "75.00"
    assert by_id[str(items["shirt"].id)]["dry_clean_paise"] == 7500
    assert by_id[str(items["wash_fold"].id)]["price_inr"] == "85.00"

    patch = await client.patch(
        f"/api/v1/partner/price-list/{items['shirt'].id}",
        headers=_headers(token),
        json={"is_offered": False},
    )
    assert patch.status_code == 200
    patched = patch.json()["data"]
    assert patched["is_offered"] is False
    assert patched["dry_clean_inr"] == "75.00"
    assert patched["has_override"] is True
    assert laundry.id is not None


async def test_apply_suggested_idempotent(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    first = await client.post(
        "/api/v1/partner/price-list/apply-suggested",
        headers=_headers(token),
    )
    assert first.status_code == 200
    assert first.json()["data"]["created"] == 3
    assert first.json()["data"]["skipped_existing"] == 0

    await client.patch(
        f"/api/v1/partner/price-list/{items['shirt'].id}",
        headers=_headers(token),
        json={"dry_clean_inr": "99.00", "press_inr": "25.00", "is_offered": True},
    )

    second = await client.post(
        "/api/v1/partner/price-list/apply-suggested",
        headers=_headers(token),
    )
    assert second.status_code == 200
    assert second.json()["data"]["created"] == 0
    assert second.json()["data"]["skipped_existing"] == 3

    listed = await client.get("/api/v1/partner/price-list", headers=_headers(token))
    by_id = {row["catalog_item_id"]: row for row in listed.json()["data"]["items"]}
    assert by_id[str(items["shirt"].id)]["dry_clean_inr"] == "99.00"
    assert by_id[str(items["wash_fold"].id)]["price_inr"] == "79.00"


async def test_idor_partner_cannot_see_or_mutate_other_laundry_prices(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner_a, laundry_a, token_a = await _seed_partner(session, email_prefix="price.a")
    _partner_b, laundry_b, token_b = await _seed_partner(session, email_prefix="price.b")
    items = await _seed_catalog_items(session)

    put_a = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token_a),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "dry_clean_inr": "111.00",
                    "press_inr": "22.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert put_a.status_code == 200

    list_b = await client.get("/api/v1/partner/price-list", headers=_headers(token_b))
    assert list_b.status_code == 200
    by_id = {row["catalog_item_id"]: row for row in list_b.json()["data"]["items"]}
    assert by_id[str(items["shirt"].id)]["has_override"] is False
    assert by_id[str(items["shirt"].id)]["dry_clean_inr"] is None

    apply_b = await client.post(
        "/api/v1/partner/price-list/apply-suggested",
        headers=_headers(token_b),
    )
    assert apply_b.status_code == 200
    assert apply_b.json()["data"]["created"] == 3

    list_a = await client.get("/api/v1/partner/price-list", headers=_headers(token_a))
    by_a = {row["catalog_item_id"]: row for row in list_a.json()["data"]["items"]}
    assert by_a[str(items["shirt"].id)]["dry_clean_inr"] == "111.00"
    assert laundry_a.id != laundry_b.id


async def test_rejects_press_when_catalog_has_no_press(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    response = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["cap"].id),
                    "dry_clean_inr": "39.00",
                    "press_inr": "10.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"


async def test_rejects_negative_and_over_cap_prices(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    negative = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "dry_clean_inr": "-1.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert negative.status_code == 422

    over_cap = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "dry_clean_inr": "100000.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert over_cap.status_code == 422


async def test_rejects_offered_without_price(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    response = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["shirt"].id),
                    "is_offered": True,
                },
            ],
        },
    )
    assert response.status_code == 422


async def test_rejects_wrong_price_mode_for_by_kg(
    price_list_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = price_list_client
    _partner, _laundry, token = await _seed_partner(session)
    items = await _seed_catalog_items(session)

    response = await client.put(
        "/api/v1/partner/price-list",
        headers=_headers(token),
        json={
            "items": [
                {
                    "catalog_item_id": str(items["wash_fold"].id),
                    "dry_clean_inr": "79.00",
                    "is_offered": True,
                },
            ],
        },
    )
    assert response.status_code == 422
