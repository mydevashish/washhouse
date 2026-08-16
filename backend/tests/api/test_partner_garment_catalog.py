"""Partner garment catalog API integration tests."""

from __future__ import annotations

import io
import os
from collections.abc import AsyncIterator
from decimal import Decimal
from pathlib import Path
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
from app.models.enums import GarmentCategory, GarmentServiceType, LaundryStatus, UserRole
from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate
from app.models.laundry import Laundry
from app.models.user import User

import app.models  # noqa: F401

pytestmark = pytest.mark.asyncio

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
DEFAULT_XLS = FIXTURES / "default_garment_catalog.xls"


@pytest.fixture(autouse=True)
def _disable_redis_rate_limit_middleware():
    with patch.object(settings, "RATE_LIMIT_ENABLED", False):
        yield


@pytest_asyncio.fixture
async def garment_catalog_client() -> AsyncIterator[tuple[AsyncClient, AsyncSession]]:
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
    email_prefix: str = "garment.partner",
) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"{email_prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Garment Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name="Garment Catalog Laundry",
        slug=f"garment-catalog-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Garment Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


async def _seed_garment(session: AsyncSession, laundry: Laundry, *, code: str = "TF") -> LaundryGarmentItem:
    item = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.men,
        name="T Shirt",
        garment_code=code,
        is_visible=True,
    )
    session.add(item)
    await session.flush()
    session.add(
        LaundryGarmentServiceRate(
            garment_item_id=item.id,
            service_type=GarmentServiceType.dry_cleaning,
            price_inr=Decimal("59.00"),
        ),
    )
    await session.flush()
    return item


async def test_list_requires_auth(garment_catalog_client: tuple[AsyncClient, AsyncSession]) -> None:
    client, _ = garment_catalog_client
    resp = await client.get("/api/v1/partner/garment-catalog")
    assert resp.status_code == 401


async def test_create_list_get_patch_delete_flow(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, _, token = await _seed_partner(session)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/v1/partner/garment-catalog",
        headers=headers,
        json={
            "name": "Jeans",
            "garment_code": "Je",
            "category": "men",
            "rates": {"dry_cleaning": "79.00", "steam_press": "12.00"},
        },
    )
    assert create.status_code == 200
    body = create.json()["data"]
    garment_id = body["id"]
    assert body["garment_code"] == "Je"
    assert body["rates"]["dry_cleaning"]["price_inr"] == "79.00"

    listing = await client.get("/api/v1/partner/garment-catalog?page_size=10", headers=headers)
    assert listing.status_code == 200
    list_data = listing.json()["data"]
    assert list_data["total_records"] == 1
    assert list_data["items"][0]["name"] == "Jeans"

    detail = await client.get(f"/api/v1/partner/garment-catalog/{garment_id}", headers=headers)
    assert detail.status_code == 200

    patched = await client.patch(
        f"/api/v1/partner/garment-catalog/{garment_id}",
        headers=headers,
        json={"rates": {"dry_cleaning": "85.00"}},
    )
    assert patched.status_code == 200
    assert patched.json()["data"]["rates"]["dry_cleaning"]["price_inr"] == "85.00"

    deleted = await client.delete(f"/api/v1/partner/garment-catalog/{garment_id}", headers=headers)
    assert deleted.status_code == 200

    gone = await client.get(f"/api/v1/partner/garment-catalog/{garment_id}", headers=headers)
    assert gone.status_code == 404


async def test_summary_endpoint(garment_catalog_client: tuple[AsyncClient, AsyncSession]) -> None:
    client, session = garment_catalog_client
    _, laundry, token = await _seed_partner(session)
    await _seed_garment(session, laundry)
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/v1/partner/garment-catalog/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total"] == 1
    assert data["visible"] == 1
    assert data["categories"] == 1


async def test_import_preview_and_confirm_csv(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, _, token = await _seed_partner(session)
    headers = {"Authorization": f"Bearer {token}"}

    csv_content = (
        "Category,Garment,GarmentCode,Dry Cleaning,Steam Press\n"
        "Men,T Shirt,TF,59,15\n"
        "Men,Jeans,Je,79,12\n"
    ).encode("utf-8")
    preview = await client.post(
        "/api/v1/partner/garment-catalog/import/preview",
        headers=headers,
        files={"file": ("sample.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert preview.status_code == 200
    preview_data = preview.json()["data"]
    assert preview_data["summary"]["valid_count"] == 2
    preview_id = preview_data["preview_id"]

    confirm = await client.post(
        "/api/v1/partner/garment-catalog/import",
        headers=headers,
        json={"preview_id": preview_id, "mode": "upsert", "skip_invalid": True},
    )
    assert confirm.status_code == 200
    assert confirm.json()["data"]["imported_count"] == 2

    listing = await client.get("/api/v1/partner/garment-catalog", headers=headers)
    assert listing.json()["data"]["total_records"] == 2


async def test_import_preview_default_xls(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    if not DEFAULT_XLS.exists():
        pytest.skip("default_garment_catalog.xls fixture missing")
    client, session = garment_catalog_client
    _, _, token = await _seed_partner(session)
    headers = {"Authorization": f"Bearer {token}"}

    preview = await client.post(
        "/api/v1/partner/garment-catalog/import/preview",
        headers=headers,
        files={"file": ("Default.xls", io.BytesIO(DEFAULT_XLS.read_bytes()), "application/vnd.ms-excel")},
    )
    assert preview.status_code == 200
    assert preview.json()["data"]["summary"]["valid_count"] == 313


async def test_bulk_delete_by_category(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, laundry, token = await _seed_partner(session)
    await _seed_garment(session, laundry, code="TF")
    item2 = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.women,
        name="Saree",
        garment_code="SA",
        is_visible=True,
    )
    session.add(item2)
    await session.flush()
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/v1/partner/garment-catalog/bulk-delete",
        headers=headers,
        json={"category": "men"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["deleted_count"] == 1

    listing = await client.get("/api/v1/partner/garment-catalog", headers=headers)
    assert listing.json()["data"]["total_records"] == 1
    assert listing.json()["data"]["items"][0]["garment_code"] == "SA"


async def test_bulk_delete_all_requires_confirm(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, laundry, token = await _seed_partner(session)
    await _seed_garment(session, laundry)
    headers = {"Authorization": f"Bearer {token}"}

    blocked = await client.post(
        "/api/v1/partner/garment-catalog/bulk-delete",
        headers=headers,
        json={"all": True},
    )
    assert blocked.status_code == 422

    ok = await client.post(
        "/api/v1/partner/garment-catalog/bulk-delete",
        headers=headers,
        json={"all": True, "confirm": "DELETE"},
    )
    assert ok.status_code == 200
    assert ok.json()["data"]["deleted_count"] == 1


async def test_partner_cannot_access_other_laundry_garment(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, laundry_a, _ = await _seed_partner(session, email_prefix="garment.a")
    item = await _seed_garment(session, laundry_a)
    _, _, token_b = await _seed_partner(session, email_prefix="garment.b")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    resp = await client.get(f"/api/v1/partner/garment-catalog/{item.id}", headers=headers_b)
    assert resp.status_code == 404


async def test_download_template(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    pytest.importorskip("openpyxl")
    client, session = garment_catalog_client
    _, _, token = await _seed_partner(session)
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/v1/partner/garment-catalog/template", headers=headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers.get("content-type", "")
    disposition = resp.headers.get("content-disposition", "")
    assert "attachment" in disposition.lower()
    assert "garment-catalog-template.xlsx" in disposition
    assert len(resp.content) > 100


async def test_bulk_set_visible(
    garment_catalog_client: tuple[AsyncClient, AsyncSession],
) -> None:
    client, session = garment_catalog_client
    _, laundry, token = await _seed_partner(session)
    item_visible = await _seed_garment(session, laundry, code="TF")
    hidden = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.men,
        name="Jeans",
        garment_code="Je",
        is_visible=False,
    )
    session.add(hidden)
    await session.flush()
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/v1/partner/garment-catalog/bulk-visible",
        headers=headers,
        json={"ids": [str(item_visible.id), str(hidden.id)]},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["updated_count"] == 1

    listing = await client.get("/api/v1/partner/garment-catalog", headers=headers)
    items = {row["garment_code"]: row["is_visible"] for row in listing.json()["data"]["items"]}
    assert items["TF"] is True
    assert items["Je"] is True
