"""Garment catalog model constraint tests."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.base import Base
from app.models.enums import GarmentCategory, GarmentServiceType, LaundryStatus, UserRole
from app.models.garment_catalog import LaundryGarmentItem, LaundryGarmentServiceRate
from app.models.laundry import Laundry
from app.models.user import User

import app.models  # noqa: F401


@pytest_asyncio.fixture
async def garment_catalog_session() -> AsyncIterator[AsyncSession]:
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
        email=f"garment.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Garment Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name="Garment Test Laundry",
        slug=f"garment-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Garment Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return laundry


async def _garment(
    session: AsyncSession,
    laundry: Laundry,
    *,
    code: str = "TF",
    name: str = "T Shirt",
) -> LaundryGarmentItem:
    item = LaundryGarmentItem(
        laundry_id=laundry.id,
        category=GarmentCategory.men,
        name=name,
        garment_code=code,
        is_visible=True,
    )
    session.add(item)
    await session.flush()
    return item


def test_garment_category_enum_values() -> None:
    assert {c.value for c in GarmentCategory} == {
        "men",
        "women",
        "kids",
        "household",
        "institutional",
        "others",
    }


def test_garment_service_type_enum_values() -> None:
    assert len(GarmentServiceType) == 11
    assert GarmentServiceType.dry_cleaning.value == "dry_cleaning"
    assert GarmentServiceType.steam_press.value == "steam_press"
    assert GarmentServiceType.wash_n_iron.value == "wash_n_iron"


@pytest.mark.asyncio
async def test_garment_code_unique_per_laundry(garment_catalog_session: AsyncSession) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    await _garment(garment_catalog_session, laundry, code="TF")
    garment_catalog_session.add(
        LaundryGarmentItem(
            laundry_id=laundry.id,
            category=GarmentCategory.men,
            name="Duplicate",
            garment_code="TF",
            is_visible=True,
        ),
    )
    with pytest.raises(IntegrityError):
        await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_garment_code_unique_is_case_insensitive(
    garment_catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    await _garment(garment_catalog_session, laundry, code="tf")
    garment_catalog_session.add(
        LaundryGarmentItem(
            laundry_id=laundry.id,
            category=GarmentCategory.men,
            name="Duplicate case",
            garment_code="TF",
            is_visible=True,
        ),
    )
    with pytest.raises(IntegrityError):
        await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_same_garment_code_allowed_for_different_laundries(
    garment_catalog_session: AsyncSession,
) -> None:
    laundry_a = await _partner_laundry(garment_catalog_session)
    laundry_b = await _partner_laundry(garment_catalog_session)
    await _garment(garment_catalog_session, laundry_a, code="TF")
    await _garment(garment_catalog_session, laundry_b, code="TF")
    await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_service_rate_unique_per_garment_and_type(
    garment_catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    item = await _garment(garment_catalog_session, laundry)
    garment_catalog_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=item.id,
            service_type=GarmentServiceType.dry_cleaning,
            price_inr=Decimal("59.00"),
        ),
    )
    await garment_catalog_session.flush()
    garment_catalog_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=item.id,
            service_type=GarmentServiceType.dry_cleaning,
            price_inr=Decimal("69.00"),
        ),
    )
    with pytest.raises(IntegrityError):
        await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_service_rate_rejects_negative_price(
    garment_catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    item = await _garment(garment_catalog_session, laundry)
    garment_catalog_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=item.id,
            service_type=GarmentServiceType.steam_press,
            price_inr=Decimal("-1.00"),
        ),
    )
    with pytest.raises(IntegrityError):
        await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_soft_deleted_garment_allows_code_reuse(
    garment_catalog_session: AsyncSession,
) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    old = await _garment(garment_catalog_session, laundry, code="TF")
    old.deleted_at = datetime.now(UTC)
    await garment_catalog_session.flush()
    await _garment(garment_catalog_session, laundry, code="TF", name="T Shirt v2")
    await garment_catalog_session.flush()


@pytest.mark.asyncio
async def test_null_price_rate_allowed(garment_catalog_session: AsyncSession) -> None:
    laundry = await _partner_laundry(garment_catalog_session)
    item = await _garment(garment_catalog_session, laundry)
    garment_catalog_session.add(
        LaundryGarmentServiceRate(
            garment_item_id=item.id,
            service_type=GarmentServiceType.express_service,
            price_inr=None,
        ),
    )
    await garment_catalog_session.flush()
