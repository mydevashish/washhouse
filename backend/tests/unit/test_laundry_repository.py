"""LaundryRepository multi-owner helpers (BUG-2026-07-15-001)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User
from app.repositories.laundry import LaundryRepository

pytestmark = pytest.mark.asyncio


async def test_get_by_owner_returns_oldest_when_multiple(
    db_session: AsyncSession,
) -> None:
    partner = User(
        email=f"repo.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Repo Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    db_session.add(partner)
    await db_session.flush()

    first = Laundry(
        owner_user_id=partner.id,
        name="Oldest",
        slug=f"oldest-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Old",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    second = Laundry(
        owner_user_id=partner.id,
        name="Newest",
        slug=f"newest-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="2 New",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    db_session.add(first)
    await db_session.flush()
    db_session.add(second)
    await db_session.flush()

    repo = LaundryRepository(db_session)
    got = await repo.get_by_owner(partner.id)
    assert got is not None
    assert got.id == first.id

    listed = await repo.list_by_owner(partner.id)
    assert [row.id for row in listed] == [first.id, second.id]
