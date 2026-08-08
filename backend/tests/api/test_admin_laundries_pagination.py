"""Admin laundry list pagination — default 10, page 2, invalid size → 10."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def _seed_laundry(session: AsyncSession, *, name: str, status: LaundryStatus = LaundryStatus.approved) -> Laundry:
    partner = User(
        email=f"adm.laundry.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Admin Laundry Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name=name,
        slug=f"adm-laundry-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Admin Laundry Road",
        status=status,
        is_verified=status == LaundryStatus.approved,
    )
    session.add(laundry)
    await session.flush()
    return laundry


def _assert_page_shape(body: dict, *, page: int, page_size: int) -> None:
    assert "items" in body
    assert body["page"] == page
    assert body["page_size"] == page_size
    assert "total_records" in body
    assert "total_pages" in body
    assert "has_next" in body
    assert "has_previous" in body
    assert len(body["items"]) <= page_size


@pytest.mark.parametrize("path", ("/api/v1/admin/laundries", "/api/v1/admin/laundries/management"))
async def test_admin_laundries_paginated_default_and_boundaries(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
    path: str,
) -> None:
    for i in range(12):
        await _seed_laundry(db_session, name=f"Admin Page Laundry {i:02d}")

    listed = await client.get(path, headers=admin_headers)
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    _assert_page_shape(body, page=1, page_size=10)
    assert body["total_records"] >= 12
    assert len(body["items"]) == 10
    assert body["has_next"] is True
    assert body["has_previous"] is False

    page2 = await client.get(f"{path}?page=2&page_size=10", headers=admin_headers)
    assert page2.status_code == 200
    body2 = page2.json()["data"]
    _assert_page_shape(body2, page=2, page_size=10)
    assert len(body2["items"]) >= 2
    assert body2["has_previous"] is True

    empty = await client.get(f"{path}?page=999&page_size=10", headers=admin_headers)
    assert empty.status_code == 200
    empty_body = empty.json()["data"]
    _assert_page_shape(empty_body, page=999, page_size=10)
    assert empty_body["items"] == []

    bad = await client.get(f"{path}?page_size=15", headers=admin_headers)
    assert bad.status_code == 200
    assert bad.json()["data"]["page_size"] == 10


async def test_admin_laundries_search_filters_server_side(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    target = await _seed_laundry(db_session, name="UniqueZebraWashHouse")
    await _seed_laundry(db_session, name="OtherPlainLaundry")

    searched = await client.get(
        "/api/v1/admin/laundries",
        headers=admin_headers,
        params={"search": "ZebraWash", "page_size": 10},
    )
    assert searched.status_code == 200
    body = searched.json()["data"]
    _assert_page_shape(body, page=1, page_size=10)
    ids = {str(row["id"]) for row in body["items"]}
    assert str(target.id) in ids
    assert body["total_records"] >= 1
