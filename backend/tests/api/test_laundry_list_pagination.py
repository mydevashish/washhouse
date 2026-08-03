"""Public laundry list pagination — newly approved stores must not be truncated."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def _seed_approved(
    session: AsyncSession,
    *,
    name: str,
    avg_rating: str,
) -> Laundry:
    partner = User(
        email=f"listpage.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="List Page Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name=name,
        slug=f"listpage-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 List Page Road",
        status=LaundryStatus.approved,
        is_verified=True,
        avg_rating=Decimal(avg_rating),
        review_count=0,
        latitude=None,
        longitude=None,
    )
    session.add(laundry)
    await session.flush()
    return laundry


async def test_list_default_includes_low_rated_new_store_beyond_old_limit_of_20(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Regression: old default limit=20 ranked new 0★ stores off the first page.

    Near me on `/stores` only re-sorts the fetched list — truncated pages look
    like the store is missing even though it is approved.
    """
    for i in range(20):
        await _seed_approved(
            db_session,
            name=f"High Rated {i}",
            avg_rating="4.90",
        )
    newbie = await _seed_approved(
        db_session,
        name="Brand New Zero Star",
        avg_rating="0.00",
    )
    await db_session.flush()

    # Old clients that still request limit=20 omit the new store (rating order).
    truncated = await client.get("/api/v1/laundries", params={"limit": 20, "offset": 0})
    assert truncated.status_code == 200
    truncated_ids = {row["id"] for row in truncated.json()["data"]}
    assert str(newbie.id) not in truncated_ids
    assert truncated.json()["meta"]["pagination"]["total"] >= 21
    assert truncated.json()["meta"]["pagination"]["has_next"] is True

    # Default public list (limit=100) must include the newly approved store.
    full = await client.get("/api/v1/laundries")
    assert full.status_code == 200
    body = full.json()
    full_ids = {row["id"] for row in body["data"]}
    assert str(newbie.id) in full_ids
    assert body["meta"]["pagination"]["total"] >= 21
    assert body["meta"]["pagination"]["per_page"] == 100

    # Offset page recovers stores past limit=20 (load-more / FE multi-page path).
    page2 = await client.get("/api/v1/laundries", params={"limit": 20, "offset": 20})
    assert page2.status_code == 200
    page2_ids = {row["id"] for row in page2.json()["data"]}
    assert str(newbie.id) in page2_ids


async def test_list_includes_approved_store_without_coordinates(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Missing lat/lng must not exclude a store from the public directory."""
    laundry = await _seed_approved(
        db_session,
        name="No Pins Yet Laundry",
        avg_rating="3.20",
    )
    await db_session.flush()

    response = await client.get("/api/v1/laundries")
    assert response.status_code == 200
    match = next(r for r in response.json()["data"] if r["id"] == str(laundry.id))
    assert match["latitude"] is None
    assert match["longitude"] is None
