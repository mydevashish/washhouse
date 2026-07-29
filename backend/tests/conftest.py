"""Shared pytest fixtures."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine as create_sync_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User

# Default test DB (matches CI). Override via env for local runs.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://dlm:dlm_dev_password@localhost:5432/dlm_test",
)
os.environ.setdefault(
    "DATABASE_URL_DIRECT",
    "postgresql://dlm:dlm_dev_password@localhost:5432/dlm_test",
)
os.environ.setdefault("JWT_SECRET", "test-secret-key-at-least-32-bytes!!")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("OTP_DEBUG", "true")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

_FIXTURE_PASSWORD = "SecurePass123!"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
def _prepare_schema() -> None:
    """Create tables once with a sync engine (avoids async loop coupling)."""
    direct = os.environ["DATABASE_URL_DIRECT"]
    sync_eng = create_sync_engine(direct)
    try:
        Base.metadata.drop_all(sync_eng)
        Base.metadata.create_all(sync_eng)
    finally:
        sync_eng.dispose()


@pytest_asyncio.fixture
async def engine():
    """Function-scoped NullPool engine — one loop per test (Windows-safe)."""
    url = os.environ["DATABASE_URL"]
    eng = create_async_engine(url, echo=False, poolclass=NullPool)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncIterator[AsyncSession]:
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    # Keep the same uncommitted session across requests in one test so
    # register → login chains can see flushed rows. Fixture teardown rolls back.
    async def _override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_session] = _override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def _seed_role_user(session: AsyncSession, *, role: UserRole, prefix: str) -> User:
    user = User(
        email=f"{prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password(_FIXTURE_PASSWORD),
        full_name=f"Fixture {role.value.title()}",
        role=role,
        is_email_verified=True,
    )
    session.add(user)
    await session.flush()
    return user


def _bearer_headers(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def customer_user(db_session: AsyncSession) -> User:
    return await _seed_role_user(db_session, role=UserRole.customer, prefix="fx.customer")


@pytest_asyncio.fixture
async def partner_user(db_session: AsyncSession) -> User:
    return await _seed_role_user(db_session, role=UserRole.partner, prefix="fx.partner")


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    return await _seed_role_user(db_session, role=UserRole.admin, prefix="fx.admin")


@pytest_asyncio.fixture
async def partner_laundry(db_session: AsyncSession, partner_user: User) -> Laundry:
    laundry = Laundry(
        owner_user_id=partner_user.id,
        name="Fixture Partner Laundry",
        slug=f"fx-partner-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Fixture Road, Koramangala",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    db_session.add(laundry)
    await db_session.flush()
    return laundry


@pytest_asyncio.fixture
async def customer_headers(customer_user: User) -> dict[str, str]:
    return _bearer_headers(customer_user)


@pytest_asyncio.fixture
async def partner_headers(partner_user: User, partner_laundry: Laundry) -> dict[str, str]:
    # Ensure partner has an approved laundry for ops endpoints that require ownership.
    assert partner_laundry.owner_user_id == partner_user.id
    return _bearer_headers(partner_user)


@pytest_asyncio.fixture
async def admin_headers(admin_user: User) -> dict[str, str]:
    return _bearer_headers(admin_user)
