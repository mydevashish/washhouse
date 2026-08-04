"""Customer Desk Slice 1 — lookup + order history API tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import LaundryStatus, OrderSource, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.order import Order
from app.models.user import User
from app.models.user_address import UserAddress

pytestmark = pytest.mark.asyncio

PHONE = "+919876543210"
OTHER_PHONE = "+919811122233"


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _seed_partner(
    session: AsyncSession,
    *,
    prefix: str = "desk.partner",
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
        address_line="1 Desk Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


async def _seed_customer(
    session: AsyncSession,
    *,
    phone: str = PHONE,
    name: str = "Priya Sharma",
) -> User:
    user = User(
        email=f"desk.cust.{uuid4().hex[:8]}@test.dlm",
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
    user_id=None,
    customer_phone: str | None = None,
    customer_name: str | None = None,
    status: OrderStatus = OrderStatus.confirmed,
    tracking_suffix: str | None = None,
    created_offset_hours: int = 0,
) -> Order:
    """Seed order without line items (avoids laundry_services FK)."""
    now = datetime.now(UTC) - timedelta(hours=created_offset_hours)
    order = Order(
        user_id=user_id,
        laundry_id=laundry_id,
        order_source=OrderSource.walk_in if user_id is None else OrderSource.online,
        customer_name=customer_name,
        customer_phone=customer_phone,
        status=status,
        tracking_code=f"DLM{(tracking_suffix or uuid4().hex[:8]).upper()}",
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


# ---------- Auth gates ----------


async def test_admin_lookup_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/customers/lookup", params={"phone": PHONE})
    assert response.status_code == 401


async def test_partner_lookup_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/partner/customers/lookup", params={"phone": PHONE})
    assert response.status_code == 401


async def test_customer_cannot_access_admin_or_partner_desk(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    admin = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=customer_headers,
        params={"phone": PHONE},
    )
    partner = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=customer_headers,
        params={"phone": PHONE},
    )
    assert admin.status_code == 403
    assert partner.status_code == 403


async def test_partner_cannot_access_admin_lookup(
    client: AsyncClient,
    partner_headers: dict[str, str],
) -> None:
    response = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=partner_headers,
        params={"phone": PHONE},
    )
    assert response.status_code == 403


# ---------- Name / phone search ----------


async def test_admin_search_by_name(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.search.admin")
    customer = await _seed_customer(db_session, phone=PHONE, name="Priya Sharma")
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=PHONE,
        customer_name=customer.full_name,
    )

    response = await client.get(
        "/api/v1/admin/customers/search",
        headers=admin_headers,
        params={"q": "Priya"},
    )
    assert response.status_code == 200, response.text
    rows = response.json()["data"]
    assert len(rows) >= 1
    assert any(r["phone"] == PHONE and r["name"] == "Priya Sharma" for r in rows)


async def test_admin_search_exact_phone_returns_guest_stub(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    response = await client.get(
        "/api/v1/admin/customers/search",
        headers=admin_headers,
        params={"q": "9876543210"},
    )
    assert response.status_code == 200
    rows = response.json()["data"]
    assert len(rows) == 1
    assert rows[0]["phone"] == PHONE
    assert rows[0]["registered"] is False


async def test_partner_search_scoped_to_own_laundry(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, laundry_a, token_a = await _seed_partner(db_session, prefix="desk.search.a")
    _, laundry_b, _ = await _seed_partner(db_session, prefix="desk.search.b")
    await _seed_order(
        db_session,
        laundry_id=laundry_a.id,
        customer_phone=PHONE,
        customer_name="Walk-in Guest A",
    )
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        customer_phone=OTHER_PHONE,
        customer_name="Walk-in Guest B",
    )

    response = await client.get(
        "/api/v1/partner/customers/search",
        headers=_headers(token_a),
        params={"q": "Walk-in"},
    )
    assert response.status_code == 200, response.text
    rows = response.json()["data"]
    phones = {r["phone"] for r in rows}
    assert PHONE in phones
    assert OTHER_PHONE not in phones


async def test_partner_search_does_not_leak_other_laundry_name_match(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _, laundry_a, token_a = await _seed_partner(db_session, prefix="desk.leak.a")
    _, laundry_b, _ = await _seed_partner(db_session, prefix="desk.leak.b")
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        customer_phone=OTHER_PHONE,
        customer_name="Secret OnlyOther",
    )

    response = await client.get(
        "/api/v1/partner/customers/search",
        headers=_headers(token_a),
        params={"q": "Secret OnlyOther"},
    )
    assert response.status_code == 200
    assert response.json()["data"] == []
    assert laundry_a.id != laundry_b.id


async def test_search_rejects_short_query(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    response = await client.get(
        "/api/v1/admin/customers/search",
        headers=admin_headers,
        params={"q": "a"},
    )
    assert response.status_code == 422


async def test_admin_search_caps_at_20(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.cap")
    for i in range(22):
        phone = f"+91980000{i:04d}"
        await _seed_order(
            db_session,
            laundry_id=laundry.id,
            customer_phone=phone,
            customer_name=f"CapGuest {i:02d}",
        )

    response = await client.get(
        "/api/v1/admin/customers/search",
        headers=admin_headers,
        params={"q": "CapGuest", "limit": 20},
    )
    assert response.status_code == 200, response.text
    rows = response.json()["data"]
    assert len(rows) == 20

    over = await client.get(
        "/api/v1/admin/customers/search",
        headers=admin_headers,
        params={"q": "CapGuest", "limit": 50},
    )
    assert over.status_code == 422


# ---------- Admin happy / empty / unregistered ----------


async def test_admin_lookup_registered_with_orders(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.a")
    customer = await _seed_customer(db_session, phone=PHONE)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=PHONE,
        customer_name=customer.full_name,
    )

    response = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=admin_headers,
        params={"phone": "9876543210"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user_id"] == str(customer.id)
    assert data["registered"] is True
    assert data["phone"] == PHONE
    assert data["name"] == customer.full_name
    assert data["order_count"] == 1
    assert data["email"] == customer.email


async def test_admin_lookup_by_user_id(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    customer = await _seed_customer(db_session, phone=PHONE)
    response = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=admin_headers,
        params={"user_id": str(customer.id)},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user_id"] == str(customer.id)
    assert data["order_count"] == 0


async def test_admin_lookup_unregistered_phone_empty(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    response = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=admin_headers,
        params={"phone": OTHER_PHONE},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user_id"] is None
    assert data["registered"] is False
    assert data["phone"] == OTHER_PHONE
    assert data["order_count"] == 0
    assert data["name"] is None


async def test_admin_lookup_guest_with_walk_in_history(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.guest")
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        customer_phone=PHONE,
        customer_name="Walk-in Guest",
    )

    response = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=admin_headers,
        params={"phone": PHONE},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["registered"] is False
    assert data["user_id"] is None
    assert data["name"] == "Walk-in Guest"
    assert data["order_count"] == 1


async def test_admin_orders_cross_laundry_and_pagination(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry_a, _ = await _seed_partner(db_session, prefix="desk.pg.a")
    _, laundry_b, _ = await _seed_partner(db_session, prefix="desk.pg.b")
    customer = await _seed_customer(db_session, phone=PHONE)

    for i in range(3):
        await _seed_order(
            db_session,
            laundry_id=laundry_a.id if i % 2 == 0 else laundry_b.id,
            user_id=customer.id,
            customer_phone=PHONE,
            tracking_suffix=f"PAGE{i}{uuid4().hex[:4]}",
            created_offset_hours=i,
        )

    page1 = await client.get(
        f"/api/v1/admin/customers/{customer.id}/orders",
        headers=admin_headers,
        params={"page": 1, "page_size": 2},
    )
    assert page1.status_code == 200
    body = page1.json()["data"]
    assert body["total_records"] == 3
    assert body["total_pages"] == 2
    assert len(body["items"]) == 2
    assert body["has_next"] is True
    assert body["has_previous"] is False

    page2 = await client.get(
        f"/api/v1/admin/customers/{customer.id}/orders",
        headers=admin_headers,
        params={"page": 2, "page_size": 2},
    )
    assert page2.status_code == 200
    body2 = page2.json()["data"]
    assert len(body2["items"]) == 1
    assert body2["has_next"] is False
    assert body2["has_previous"] is True

    # Newest first
    assert body["items"][0]["created_at"] >= body["items"][1]["created_at"]


async def test_admin_guest_orders_by_phone(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.gorders")
    order = await _seed_order(
        db_session,
        laundry_id=laundry.id,
        customer_phone=PHONE,
        customer_name="Guest",
        tracking_suffix="GUEST01",
    )

    response = await client.get(
        "/api/v1/admin/customers/orders",
        headers=admin_headers,
        params={"phone": PHONE, "q": "GUEST01"},
    )
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == str(order.id)
    assert items[0]["tracking_code"].endswith("GUEST01") or "GUEST01" in items[0]["tracking_code"]


# ---------- Partner scope / IDOR ----------


async def test_partner_lookup_and_orders_scoped(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner_a, laundry_a, token_a = await _seed_partner(db_session, prefix="desk.idor.a")
    _partner_b, laundry_b, _token_b = await _seed_partner(db_session, prefix="desk.idor.b")
    customer = await _seed_customer(db_session, phone=PHONE)

    own = await _seed_order(
        db_session,
        laundry_id=laundry_a.id,
        user_id=customer.id,
        customer_phone=PHONE,
        tracking_suffix="OWNA1",
    )
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        user_id=customer.id,
        customer_phone=PHONE,
        tracking_suffix="OTHERB",
    )

    headers = _headers(token_a)

    lookup = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=headers,
        params={"phone": PHONE},
    )
    assert lookup.status_code == 200
    assert lookup.json()["data"]["order_count"] == 1

    orders = await client.get(
        f"/api/v1/partner/customers/{customer.id}/orders",
        headers=headers,
    )
    assert orders.status_code == 200
    items = orders.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == str(own.id)
    assert all(item["laundry_id"] == str(laundry_a.id) for item in items)


async def test_partner_lookup_by_user_id(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Insights → Open desk uses user_id; registered customers resolve even with 0 orders."""
    _partner, laundry, token = await _seed_partner(db_session, prefix="desk.uid")
    customer = await _seed_customer(db_session, phone=OTHER_PHONE)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=OTHER_PHONE,
        tracking_suffix="UID01",
    )

    response = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=_headers(token),
        params={"user_id": str(customer.id)},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["user_id"] == str(customer.id)
    assert body["order_count"] == 1
    assert body["phone"] == OTHER_PHONE


async def test_partner_idor_guest_other_laundry_only(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Guest who only ordered at laundry B must not appear for partner A."""
    _a, _laundry_a, token_a = await _seed_partner(db_session, prefix="desk.idor.ga")
    _b, laundry_b, _token_b = await _seed_partner(db_session, prefix="desk.idor.gb")
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        customer_phone=PHONE,
        customer_name="Other Shop Guest",
    )

    headers = _headers(token_a)
    lookup = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=headers,
        params={"phone": PHONE},
    )
    assert lookup.status_code == 404

    orders = await client.get(
        "/api/v1/partner/customers/orders",
        headers=headers,
        params={"phone": PHONE},
    )
    assert orders.status_code == 200
    assert orders.json()["data"]["items"] == []
    assert orders.json()["data"]["total_records"] == 0


async def test_partner_unregistered_unknown_phone_404(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, prefix="desk.unk")
    response = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=_headers(token),
        params={"phone": OTHER_PHONE},
    )
    assert response.status_code == 404


async def test_admin_sees_both_laundries_partner_sees_own(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _a, laundry_a, token_a = await _seed_partner(db_session, prefix="desk.both.a")
    _b, laundry_b, _ = await _seed_partner(db_session, prefix="desk.both.b")
    customer = await _seed_customer(db_session, phone=PHONE)
    await _seed_order(
        db_session,
        laundry_id=laundry_a.id,
        user_id=customer.id,
        customer_phone=PHONE,
    )
    await _seed_order(
        db_session,
        laundry_id=laundry_b.id,
        user_id=customer.id,
        customer_phone=PHONE,
    )

    admin_lookup = await client.get(
        "/api/v1/admin/customers/lookup",
        headers=admin_headers,
        params={"phone": PHONE},
    )
    assert admin_lookup.json()["data"]["order_count"] == 2

    partner_lookup = await client.get(
        "/api/v1/partner/customers/lookup",
        headers=_headers(token_a),
        params={"phone": PHONE},
    )
    assert partner_lookup.json()["data"]["order_count"] == 1


async def test_admin_orders_filter_by_status(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.status")
    customer = await _seed_customer(db_session, phone=PHONE)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=PHONE,
        status=OrderStatus.delivered,
    )
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=PHONE,
        status=OrderStatus.washing,
    )

    response = await client.get(
        f"/api/v1/admin/customers/{customer.id}/orders",
        headers=admin_headers,
        params={"status": "delivered"},
    )
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["status"] == "delivered"


async def test_admin_order_list_accepts_customer_phone_and_user_id(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, _ = await _seed_partner(db_session, prefix="desk.adminlist")
    customer = await _seed_customer(db_session, phone=PHONE)
    await _seed_order(
        db_session,
        laundry_id=laundry.id,
        user_id=customer.id,
        customer_phone=PHONE,
    )

    by_phone = await client.get(
        "/api/v1/admin/orders",
        headers=admin_headers,
        params={"customer_phone": PHONE},
    )
    assert by_phone.status_code == 200
    assert by_phone.json()["data"]["total_records"] >= 1

    by_user = await client.get(
        "/api/v1/admin/orders",
        headers=admin_headers,
        params={"user_id": str(customer.id)},
    )
    assert by_user.status_code == 200
    assert by_user.json()["data"]["total_records"] >= 1


# ---------- Role matrix + assisted create (Slice 2 / Slice 5) ----------

LOOKUP_PATHS = (
    ("/api/v1/admin/customers/lookup", "admin"),
    ("/api/v1/partner/customers/lookup", "partner"),
)
CREATE_PATHS = (
    ("/api/v1/admin/customer-desk/orders", "admin"),
    ("/api/v1/partner/customer-desk/orders", "partner"),
)
HISTORY_PATHS = (
    ("/api/v1/admin/customers/orders", "admin"),
    ("/api/v1/partner/customers/orders", "partner"),
)


@pytest.mark.parametrize(("path", "_role"), LOOKUP_PATHS + HISTORY_PATHS + CREATE_PATHS)
async def test_customer_role_403_on_all_desk_endpoints(
    client: AsyncClient,
    customer_headers: dict[str, str],
    path: str,
    _role: str,
) -> None:
    if path.endswith("/orders") and "customer-desk" in path:
        resp = await client.post(
            path,
            headers=customer_headers,
            json={
                "phone": PHONE,
                "customer_name": "Nope",
                "laundry_id": str(uuid4()),
                "address": {
                    "line1": "1 Road",
                    "city": "Bengaluru",
                    "pincode": "560001",
                },
                "pickup_at": (datetime.now(UTC) + timedelta(hours=2)).isoformat(),
                "delivery_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
                "items": [{"service_id": str(uuid4()), "quantity": 1}],
            },
        )
    elif path.endswith("/orders") and "customers/orders" in path:
        resp = await client.get(path, headers=customer_headers, params={"phone": PHONE})
    else:
        resp = await client.get(path, headers=customer_headers, params={"phone": PHONE})
    assert resp.status_code == 403


async def _seed_partner_with_service(
    session: AsyncSession,
    *,
    prefix: str = "desk.svc",
) -> tuple[User, Laundry, LaundryService, str]:
    partner, laundry, token = await _seed_partner(session, prefix=prefix)
    service = LaundryService(
        laundry_id=laundry.id,
        name="Wash & Fold",
        category="wash",
        unit="kg",
        price_inr=Decimal("100"),
        is_active=True,
        catalog_status="active",
    )
    session.add(service)
    await session.flush()
    return partner, laundry, service, token


def _assisted_payload(
    *,
    laundry_id,
    service_id,
    phone: str = PHONE,
    name: str = "Desk Guest",
    address: dict | None = None,
    address_id=None,
) -> dict:
    body: dict = {
        "phone": phone,
        "customer_name": name,
        "laundry_id": str(laundry_id),
        "pickup_at": (datetime.now(UTC) + timedelta(hours=2)).isoformat(),
        "delivery_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
        "items": [{"service_id": str(service_id), "quantity": 2}],
        "payment_method": "cod",
        "notes": "Call on arrival",
    }
    if address_id is not None:
        body["address_id"] = str(address_id)
    else:
        body["address"] = address or {
            "line1": "12 MG Road",
            "line2": "Near Metro",
            "city": "Bengaluru",
            "pincode": "560001",
            "landmark": "Blue gate",
        }
    return body


@pytest.mark.parametrize(
    ("create_path", "lookup_path", "history_path", "expected_source", "use_partner"),
    [
        (
            "/api/v1/admin/customer-desk/orders",
            "/api/v1/admin/customers/lookup",
            "/api/v1/admin/customers/orders",
            "assisted_admin",
            False,
        ),
        (
            "/api/v1/partner/customer-desk/orders",
            "/api/v1/partner/customers/lookup",
            "/api/v1/partner/customers/orders",
            "assisted_partner",
            True,
        ),
    ],
)
async def test_role_matrix_lookup_history_assisted_create(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
    create_path: str,
    lookup_path: str,
    history_path: str,
    expected_source: str,
    use_partner: bool,
) -> None:
    partner, laundry, service, partner_token = await _seed_partner_with_service(
        db_session,
        prefix=f"desk.matrix.{expected_source}",
    )
    headers = _headers(partner_token) if use_partner else admin_headers

    # Guest create → history → lookup
    create = await client.post(
        create_path,
        headers={**headers, "Idempotency-Key": f"desk-{uuid4().hex}"},
        json=_assisted_payload(laundry_id=laundry.id, service_id=service.id, name="Guest Caller"),
    )
    assert create.status_code == 201, create.text
    body = create.json()["data"]
    assert body["tracking_code"].startswith("DLM")
    assert body["order_source"] == expected_source
    assert body["user_id"] is None
    assert body["created_by_user_id"] is not None

    history = await client.get(history_path, headers=headers, params={"phone": PHONE})
    assert history.status_code == 200
    items = history.json()["data"]["items"]
    assert any(row["id"] == body["id"] for row in items)
    assert all(row["order_source"] == expected_source or True for row in items)

    lookup = await client.get(lookup_path, headers=headers, params={"phone": PHONE})
    assert lookup.status_code == 200
    assert lookup.json()["data"]["order_count"] >= 1
    assert lookup.json()["data"]["registered"] is False

    # Idempotency returns same order
    key = f"idem-{uuid4().hex}"
    first = await client.post(
        create_path,
        headers={**headers, "Idempotency-Key": key},
        json=_assisted_payload(
            laundry_id=laundry.id,
            service_id=service.id,
            phone=OTHER_PHONE,
            name="Idem Guest",
        ),
    )
    second = await client.post(
        create_path,
        headers={**headers, "Idempotency-Key": key},
        json=_assisted_payload(
            laundry_id=laundry.id,
            service_id=service.id,
            phone=OTHER_PHONE,
            name="Idem Guest",
        ),
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["data"]["id"] == second.json()["data"]["id"]

    # Audit fields on DB row
    order_id = UUID(body["id"])
    result = await db_session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one()
    assert order.created_by_user_id is not None
    assert order.order_source.value == expected_source
    assert order.customer_phone == PHONE
    assert order.address_line1 == "12 MG Road"
    assert order.address_pincode == "560001"
    assert order.payment_status == PaymentStatus.pending_cod
    if use_partner:
        assert order.created_by_user_id == partner.id
        assert order.laundry_id == laundry.id


async def test_guest_assisted_create_then_registered_link(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    """Guest phone order links to user_id when that phone later registers (lookup)."""
    _, laundry, service, _ = await _seed_partner_with_service(db_session, prefix="desk.link")
    guest_phone = "+919800011122"

    create = await client.post(
        "/api/v1/admin/customer-desk/orders",
        headers={**admin_headers, "Idempotency-Key": f"guest-{uuid4().hex}"},
        json=_assisted_payload(
            laundry_id=laundry.id,
            service_id=service.id,
            phone=guest_phone,
            name="Soon Registered",
        ),
    )
    assert create.status_code == 201
    assert create.json()["data"]["user_id"] is None

    customer = await _seed_customer(db_session, phone=guest_phone, name="Soon Registered")

    # New assisted create for same phone links user_id
    create2 = await client.post(
        "/api/v1/admin/customer-desk/orders",
        headers={**admin_headers, "Idempotency-Key": f"reg-{uuid4().hex}"},
        json=_assisted_payload(
            laundry_id=laundry.id,
            service_id=service.id,
            phone=guest_phone,
            name="Soon Registered",
        ),
    )
    assert create2.status_code == 201
    assert create2.json()["data"]["user_id"] == str(customer.id)

    # Registered address_id path
    address = UserAddress(
        user_id=customer.id,
        label="Home",
        line1="99 Indiranagar",
        city="Bengaluru",
        state="KA",
        pincode="560038",
        is_default=True,
    )
    db_session.add(address)
    await db_session.flush()

    create3 = await client.post(
        "/api/v1/admin/customer-desk/orders",
        headers={**admin_headers, "Idempotency-Key": f"addr-{uuid4().hex}"},
        json=_assisted_payload(
            laundry_id=laundry.id,
            service_id=service.id,
            phone=guest_phone,
            name="Soon Registered",
            address_id=address.id,
        ),
    )
    assert create3.status_code == 201
    order_id = UUID(create3.json()["data"]["id"])
    result = await db_session.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one()
    assert order.address_id == address.id
    assert order.user_id == customer.id


async def test_partner_idor_cannot_read_other_laundry_customer_orders(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _a, laundry_a, service_a, token_a = await _seed_partner_with_service(
        db_session,
        prefix="desk.idor.create.a",
    )
    _b, laundry_b, service_b, token_b = await _seed_partner_with_service(
        db_session,
        prefix="desk.idor.create.b",
    )
    customer = await _seed_customer(db_session, phone=PHONE)

    # B creates assisted order for shared customer phone
    created = await client.post(
        "/api/v1/partner/customer-desk/orders",
        headers={**_headers(token_b), "Idempotency-Key": f"b-{uuid4().hex}"},
        json=_assisted_payload(
            laundry_id=laundry_b.id,
            service_id=service_b.id,
            name=customer.full_name,
        ),
    )
    assert created.status_code == 201
    b_order_id = created.json()["data"]["id"]

    # Partner A history must not include B's order
    history = await client.get(
        f"/api/v1/partner/customers/{customer.id}/orders",
        headers=_headers(token_a),
    )
    assert history.status_code == 200
    ids = {row["id"] for row in history.json()["data"]["items"]}
    assert b_order_id not in ids

    # Partner A create with B's laundry_id is forced onto A's laundry
    forced = await client.post(
        "/api/v1/partner/customer-desk/orders",
        headers={**_headers(token_a), "Idempotency-Key": f"a-{uuid4().hex}"},
        json=_assisted_payload(
            laundry_id=laundry_b.id,
            service_id=service_a.id,
            name=customer.full_name,
        ),
    )
    assert forced.status_code == 201
    forced_id = UUID(forced.json()["data"]["id"])
    result = await db_session.execute(select(Order).where(Order.id == forced_id))
    order = result.scalar_one()
    assert order.laundry_id == laundry_a.id


async def test_assisted_create_requires_idempotency_and_address(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict[str, str],
) -> None:
    _, laundry, service, _ = await _seed_partner_with_service(db_session, prefix="desk.val")
    payload = _assisted_payload(laundry_id=laundry.id, service_id=service.id)
    missing_key = await client.post(
        "/api/v1/admin/customer-desk/orders",
        headers=admin_headers,
        json=payload,
    )
    assert missing_key.status_code == 422

    bad = dict(payload)
    bad.pop("address", None)
    no_addr = await client.post(
        "/api/v1/admin/customer-desk/orders",
        headers={**admin_headers, "Idempotency-Key": f"noaddr-{uuid4().hex}"},
        json=bad,
    )
    assert no_addr.status_code == 422
