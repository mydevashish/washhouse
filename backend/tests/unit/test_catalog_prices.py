"""Catalog / laundry_item_prices repository tests."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from decimal import Decimal
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.base import Base
from app.db.seed_washhouse_catalog import ensure_washhouse_catalog, washhouse_seed_rows
from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit, LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User
from app.repositories.catalog import CatalogRepository

# Ensure catalog models are registered on Base.metadata before create_all.
import app.models  # noqa: F401

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def catalog_session() -> AsyncIterator[AsyncSession]:
    """Function-scoped session — avoids session-engine / function-loop mismatch on Windows."""
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://dlm:dlm_dev_password@localhost:5432/dlm_test",
    )
    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()
    await engine.dispose()


async def _partner_laundry(session: AsyncSession) -> Laundry:
    partner = User(
        email=f"catalog.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Catalog Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name="Catalog Test Laundry",
        slug=f"catalog-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Catalog Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return laundry


async def test_laundry_item_price_unique_per_laundry_catalog(
    catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(catalog_session)
    item = PlatformCatalogItem(
        slug=f"men-shirt-{uuid4().hex[:8]}",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    catalog_session.add(item)
    await catalog_session.flush()

    repo = CatalogRepository(catalog_session)
    await repo.create_laundry_price(
        LaundryItemPrice(
            laundry_id=laundry.id,
            catalog_item_id=item.id,
            dry_clean_inr=Decimal("75.00"),
            press_inr=Decimal("20.00"),
            is_offered=True,
        ),
    )

    with pytest.raises(IntegrityError):
        await repo.create_laundry_price(
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=item.id,
                dry_clean_inr=Decimal("80.00"),
                press_inr=Decimal("25.00"),
                is_offered=True,
            ),
        )
        await catalog_session.flush()

    await catalog_session.rollback()


async def test_nullable_press_allowed_on_dual_price_item(
    catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(catalog_session)
    item = PlatformCatalogItem(
        slug=f"men-cap-fabric-{uuid4().hex[:8]}",
        name="Cap (fabric)",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("39.00"),
        suggested_press_inr=None,
        sort_order=20,
    )
    catalog_session.add(item)
    await catalog_session.flush()

    repo = CatalogRepository(catalog_session)
    row = await repo.create_laundry_price(
        LaundryItemPrice(
            laundry_id=laundry.id,
            catalog_item_id=item.id,
            dry_clean_inr=Decimal("39.00"),
            press_inr=None,
            is_offered=True,
        ),
    )
    assert row.press_inr is None
    assert row.dry_clean_inr == Decimal("39.00")
    assert row.price_inr is None

    fetched = await repo.get_laundry_price(laundry.id, item.id)
    assert fetched is not None
    assert fetched.press_inr is None


async def test_single_price_inr_for_by_kg_item(catalog_session: AsyncSession) -> None:
    laundry = await _partner_laundry(catalog_session)
    item = PlatformCatalogItem(
        slug=f"kg-wash-fold-{uuid4().hex[:8]}",
        name="Wash & Fold",
        category=CatalogCategory.laundry_by_kg,
        unit=CatalogUnit.kg,
        suggested_price_inr=Decimal("79.00"),
        sort_order=10,
    )
    catalog_session.add(item)
    await catalog_session.flush()

    repo = CatalogRepository(catalog_session)
    row = await repo.create_laundry_price(
        LaundryItemPrice(
            laundry_id=laundry.id,
            catalog_item_id=item.id,
            price_inr=Decimal("85.00"),
            is_offered=True,
        ),
    )
    assert row.price_inr == Decimal("85.00")
    assert row.dry_clean_inr is None
    assert row.press_inr is None


async def test_price_shape_rejects_mixed_single_and_dual(
    catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(catalog_session)
    item = PlatformCatalogItem(
        slug=f"mixed-shape-{uuid4().hex[:8]}",
        name="Mixed",
        category=CatalogCategory.household,
        unit=CatalogUnit.piece,
        suggested_price_inr=Decimal("99.00"),
        sort_order=1,
    )
    catalog_session.add(item)
    await catalog_session.flush()

    with pytest.raises(IntegrityError):
        catalog_session.add(
            LaundryItemPrice(
                laundry_id=laundry.id,
                catalog_item_id=item.id,
                price_inr=Decimal("99.00"),
                dry_clean_inr=Decimal("99.00"),
                is_offered=True,
            ),
        )
        await catalog_session.flush()

    await catalog_session.rollback()


async def test_washhouse_seed_idempotent(catalog_session: AsyncSession) -> None:
    expected = len(washhouse_seed_rows())
    first = await ensure_washhouse_catalog(catalog_session)
    await catalog_session.flush()
    second = await ensure_washhouse_catalog(catalog_session)
    await catalog_session.flush()

    assert first["created"] + first["updated"] == expected
    assert second["created"] == 0
    assert second["updated"] == expected

    repo = CatalogRepository(catalog_session)
    shirt = await repo.get_item_by_slug("men-shirt-tshirt")
    assert shirt is not None
    assert shirt.suggested_dry_clean_inr == Decimal("69.00")
    assert shirt.suggested_press_inr == Decimal("15.00")
    assert shirt.suggested_price_inr is None

    kg = await repo.get_item_by_slug("kg-wash-fold")
    assert kg is not None
    assert kg.suggested_price_inr == Decimal("79.00")
    assert kg.suggested_dry_clean_inr is None

    curtain = await repo.get_item_by_slug("household-curtain-panel")
    assert curtain is not None
    assert curtain.suggested_price_inr is None
    assert curtain.unit == CatalogUnit.panel

    by_category = await repo.list_active_items(category=CatalogCategory.laundry_by_kg)
    assert {row.slug for row in by_category} >= {"kg-wash-fold", "kg-wash-iron"}
