"""Partner customer PATCH — profile edit (Prompt 4)."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, OrderSource, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User

pytestmark = pytest.mark.asyncio

PHONE = "+919876543210"


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _seed_partner(
    session: AsyncSession,
    *,
    prefix: str = "pcust.partner",
) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"{prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name=f"{prefix} Owner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name=f"{prefix} Laundry",
        slug=f"{prefix}-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 CRM Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


def _unique_phone() -> str:
    # Last 10 digits stay unique across tests that commit to dlm_test.
    suffix = uuid4().int % 10_000_000_000
    return f"+91{suffix:010d}"[-13:]


async def _seed_customer(
    session: AsyncSession,
    *,
    phone: str | None = None,
    name: str = "Priya Sharma",
) -> User:
    phone = phone or _unique_phone()
    user = User(
        email=f"pcust.cust.{uuid4().hex[:8]}@test.dlm",
        phone=phone,
        password_hash=hash_password("Customer@1234"),
        full_name=name,
        role=UserRole.customer,
        is_email_verified=True,
        is_phone_verified=True,
    )
    session.add(user)
    await session.flush()
    return user


async def _seed_order(
    session: AsyncSession,
    *,
    laundry_id,
    user_id,
    customer_name: str = "Priya Sharma",
    customer_phone: str | None = None,
) -> Order:
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    order = Order(
        user_id=user_id,
        laundry_id=laundry_id,
        order_source=OrderSource.online,
        customer_name=customer_name,
        customer_phone=customer_phone or PHONE,
        status=OrderStatus.confirmed,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now + timedelta(hours=2),
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("30.00"),
        cgst_inr=Decimal("20.70"),
        sgst_inr=Decimal("20.70"),
        total_inr=Decimal("271.40"),
        payment_status=PaymentStatus.pending_cod,
        created_at=now,
    )
    session.add(order)
    await session.flush()
    return order


async def test_partner_patch_customer_happy_path(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session)
    customer = await _seed_customer(db_session)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=customer.phone,
    )
    await db_session.commit()

    response = await client.patch(
        f"/api/v1/partner/customers/{customer.id}",
        headers=_headers(token),
        json={
            "name": "Priya S.",
            "email": "priya@example.com",
            "gender": "female",
            "notes": "Prefers evening pickup",
        },
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["name"] == "Priya S."
    assert body["email"] == "priya@example.com"
    assert body["gender"] == "female"
    assert body["notes"] == "Prefers evening pickup"
    assert body["phone"] == customer.phone


async def test_partner_patch_customer_forbidden_other_laundry(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _a, _laundry_a, token_a = await _seed_partner(db_session, prefix="pcust.a")
    _b, laundry_b, _token_b = await _seed_partner(db_session, prefix="pcust.b")
    customer = await _seed_customer(db_session)
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        user_id=customer.id,
        customer_phone=customer.phone,
    )
    await db_session.commit()

    response = await client.patch(
        f"/api/v1/partner/customers/{customer.id}",
        headers=_headers(token_a),
        json={"name": "Should Fail"},
    )
    assert response.status_code == 403


async def test_partner_patch_customer_requires_name(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session)
    customer = await _seed_customer(db_session)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=customer.phone,
    )
    await db_session.commit()

    response = await client.patch(
        f"/api/v1/partner/customers/{customer.id}",
        headers=_headers(token),
        json={"name": "   "},
    )
    assert response.status_code == 422
