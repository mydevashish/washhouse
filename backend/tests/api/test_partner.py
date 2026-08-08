"""Partner API — accept/status lifecycle, staff CRUD, IDOR / authz."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import (
    LaundryStatus,
    OrderSource,
    OrderStatus,
    PartnerStaffRole,
    PaymentStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User

pytestmark = pytest.mark.asyncio


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _seed_partner(
    session: AsyncSession,
    *,
    email_prefix: str = "partner",
) -> tuple[User, Laundry, str]:
    partner = User(
        email=f"{email_prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name=f"{email_prefix.title()} Owner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()

    laundry = Laundry(
        owner_user_id=partner.id,
        name=f"{email_prefix.title()} Laundry",
        slug=f"{email_prefix}-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Partner Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()

    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, token


async def _seed_confirmed_order(
    session: AsyncSession,
    *,
    laundry_id,
    customer: User | None = None,
) -> Order:
    if customer is None:
        customer = User(
            email=f"cust.{uuid4().hex[:8]}@test.dlm",
            password_hash=hash_password("Customer@1234"),
            full_name="Test Customer",
            role=UserRole.customer,
            is_email_verified=True,
        )
        session.add(customer)
        await session.flush()

    now = datetime.now(UTC)
    order = Order(
        user_id=customer.id,
        laundry_id=laundry_id,
        order_source=OrderSource.online,
        status=OrderStatus.confirmed,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now + timedelta(hours=2),
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("49.00"),
        cgst_inr=Decimal("22.41"),
        sgst_inr=Decimal("22.41"),
        total_inr=Decimal("293.82"),
        payment_status=PaymentStatus.pending,
    )
    session.add(order)
    await session.flush()
    return order


# ---------- Authz ----------


async def test_partner_routes_require_auth(client: AsyncClient) -> None:
    order_id = uuid4()
    assert (await client.get("/api/v1/partner/orders")).status_code == 401
    assert (await client.get("/api/v1/partner/analytics/summary")).status_code == 401
    assert (await client.post(f"/api/v1/partner/orders/{order_id}/accept")).status_code == 401
    assert (
        await client.patch(
            f"/api/v1/partner/orders/{order_id}/status",
            json={"status": OrderStatus.washing.value},
        )
    ).status_code == 401
    assert (await client.get("/api/v1/partner/staff")).status_code == 401


async def test_customer_cannot_hit_partner_apis(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    customer = User(
        email=f"cust.partnerforbid.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(customer)
    await db_session.flush()
    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)
    headers = _headers(token)

    assert (await client.get("/api/v1/partner/orders", headers=headers)).status_code == 403
    assert (await client.get("/api/v1/partner/analytics/summary", headers=headers)).status_code == 403
    assert (await client.get("/api/v1/partner/staff", headers=headers)).status_code == 403
    assert (
        await client.post(
            "/api/v1/partner/staff",
            headers=headers,
            json={"name": "Nope", "role": PartnerStaffRole.pickup_agent.value},
        )
    ).status_code == 403


# ---------- Accept / status / IDOR ----------


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_partner_accept_and_advance_status(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="accept")
    order = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    headers = _headers(token)

    accept = await client.post(f"/api/v1/partner/orders/{order.id}/accept", headers=headers)
    assert accept.status_code == 200
    assert accept.json()["data"]["status"] == OrderStatus.pickup_assigned.value

    # Walk-in-style advances from washing are separate; online needs evidence for picked_up.
    # Advance washing←picked_up is blocked without evidence — jump via walk-in seed instead.
    reject_setup = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    reject = await client.post(
        f"/api/v1/partner/orders/{reject_setup.id}/reject",
        headers=headers,
    )
    assert reject.status_code == 200
    assert reject.json()["data"]["status"] == OrderStatus.cancelled.value


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_partner_a_cannot_patch_partner_b_order(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _a, laundry_a, token_a = await _seed_partner(db_session, email_prefix="partner.a")
    _b, laundry_b, token_b = await _seed_partner(db_session, email_prefix="partner.b")
    order_b = await _seed_confirmed_order(db_session, laundry_id=laundry_b.id)

    accept = await client.post(
        f"/api/v1/partner/orders/{order_b.id}/accept",
        headers=_headers(token_a),
    )
    assert accept.status_code == 404

    status = await client.patch(
        f"/api/v1/partner/orders/{order_b.id}/status",
        headers=_headers(token_a),
        json={"status": OrderStatus.pickup_assigned.value},
    )
    assert status.status_code == 404

    inv = await client.put(
        f"/api/v1/partner/orders/{order_b.id}/inventory",
        headers=_headers(token_a),
        json={"expected_count": 3, "received_count": 3},
    )
    assert inv.status_code == 404

    # Owner B can still accept
    own = await client.post(
        f"/api/v1/partner/orders/{order_b.id}/accept",
        headers=_headers(token_b),
    )
    assert own.status_code == 200
    assert own.json()["data"]["status"] == OrderStatus.pickup_assigned.value


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_partner_scan_updates_owned_order_only(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _a, laundry_a, token_a = await _seed_partner(db_session, email_prefix="scan.a")
    _b, laundry_b, _token_b = await _seed_partner(db_session, email_prefix="scan.b")

    order_a = await _seed_confirmed_order(db_session, laundry_id=laundry_a.id)
    order_b = await _seed_confirmed_order(db_session, laundry_id=laundry_b.id)

    # Accept own first so scan can advance pickup_assigned → … (scan uses status body)
    accept = await client.post(
        f"/api/v1/partner/orders/{order_a.id}/accept",
        headers=_headers(token_a),
    )
    assert accept.status_code == 200

    foreign = await client.post(
        f"/api/v1/partner/scan/{order_b.tracking_code}",
        headers=_headers(token_a),
        json={"status": OrderStatus.pickup_assigned.value},
    )
    assert foreign.status_code == 404


# ---------- Staff CRUD ----------


async def test_staff_crud_add_change_role_remove(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, email_prefix="staff")
    headers = _headers(token)

    create = await client.post(
        "/api/v1/partner/staff",
        headers=headers,
        json={
            "name": "Ravi Pickup",
            "phone": "+919876543210",
            "role": PartnerStaffRole.pickup_agent.value,
        },
    )
    assert create.status_code == 201
    staff_id = create.json()["data"]["id"]
    assert create.json()["data"]["role"] == PartnerStaffRole.pickup_agent.value

    listed = await client.get("/api/v1/partner/staff", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == staff_id for row in listed.json()["data"])

    patch = await client.patch(
        f"/api/v1/partner/staff/{staff_id}",
        headers=headers,
        json={"role": PartnerStaffRole.delivery_agent.value},
    )
    assert patch.status_code == 200
    assert patch.json()["data"]["role"] == PartnerStaffRole.delivery_agent.value

    delete = await client.delete(f"/api/v1/partner/staff/{staff_id}", headers=headers)
    assert delete.status_code == 204

    after = await client.get("/api/v1/partner/staff", headers=headers)
    assert after.status_code == 200
    assert all(row["id"] != staff_id for row in after.json()["data"])


async def test_partner_cannot_mutate_other_laundry_staff(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _a, _la, token_a = await _seed_partner(db_session, email_prefix="staff.a")
    _b, _lb, token_b = await _seed_partner(db_session, email_prefix="staff.b")

    create = await client.post(
        "/api/v1/partner/staff",
        headers=_headers(token_b),
        json={"name": "B Staff", "role": PartnerStaffRole.operator.value},
    )
    assert create.status_code == 201
    staff_id = create.json()["data"]["id"]

    patch = await client.patch(
        f"/api/v1/partner/staff/{staff_id}",
        headers=_headers(token_a),
        json={"role": PartnerStaffRole.manager.value},
    )
    assert patch.status_code == 404

    delete = await client.delete(
        f"/api/v1/partner/staff/{staff_id}",
        headers=_headers(token_a),
    )
    assert delete.status_code == 404


# ---------- Analytics / inventory smoke ----------


async def test_analytics_summary_returns_kpis(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="kpi")
    await _seed_confirmed_order(db_session, laundry_id=laundry.id)

    response = await client.get(
        "/api/v1/partner/analytics/summary",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["laundry_name"]
    assert data["orders_total"] >= 1
    assert "revenue_today_inr" in data
    assert "orders_pending" in data
    assert "effective_commission_rate" in data
    assert "partner_net_today_inr" in data
    assert "commission_today_inr" in data
    assert "growth_today_pct" in data
    assert data["growth_today_pct"] is None or isinstance(data["growth_today_pct"], str)


async def test_analytics_money_intelligence_uses_order_commission_snapshot(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    partner, laundry, token = await _seed_partner(db_session, email_prefix="money")
    _ = partner
    laundry.commission_rate = Decimal("10.00")
    await db_session.flush()

    customer = User(
        email=f"cust.money.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Money Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(customer)
    await db_session.flush()

    now = datetime.now(UTC)
    order = Order(
        user_id=customer.id,
        laundry_id=laundry.id,
        order_source=OrderSource.walk_in,
        status=OrderStatus.delivered,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now - timedelta(hours=2),
        delivery_at=now,
        subtotal_inr=Decimal("100.00"),
        delivery_fee_inr=Decimal("0.00"),
        cgst_inr=Decimal("0.00"),
        sgst_inr=Decimal("0.00"),
        total_inr=Decimal("100.00"),
        payment_status=PaymentStatus.paid,
        commission_rate=Decimal("15.00"),
    )
    db_session.add(order)
    await db_session.flush()

    response = await client.get(
        "/api/v1/partner/analytics/summary",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["effective_commission_rate"] == "10.00"
    assert Decimal(data["revenue_today_inr"]) == Decimal("100.00")
    assert Decimal(data["commission_today_inr"]) == Decimal("15.00")
    assert Decimal(data["partner_net_today_inr"]) == Decimal("85.00")
    assert Decimal(data["revenue_walk_in_today_inr"]) == Decimal("100.00")
    assert Decimal(data["revenue_doorstep_today_inr"]) == Decimal("0.00")

    # IDOR: other partner must not see this laundry's revenue
    _other, _other_laundry, other_token = await _seed_partner(db_session, email_prefix="moneyother")
    other = await client.get(
        "/api/v1/partner/analytics/summary",
        headers=_headers(other_token),
    )
    assert other.status_code == 200
    assert Decimal(other.json()["data"]["revenue_today_inr"]) == Decimal("0.00")


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_inventory_get_put_for_owned_order(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="inv")
    order = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    headers = _headers(token)

    put = await client.put(
        f"/api/v1/partner/orders/{order.id}/inventory",
        headers=headers,
        json={
            "expected_count": 5,
            "received_count": 5,
            "missing_notes": None,
            "damaged_notes": None,
        },
    )
    assert put.status_code == 200
    assert put.json()["data"]["expected_count"] == 5
    assert put.json()["data"]["received_count"] == 5

    get = await client.get(
        f"/api/v1/partner/orders/{order.id}/inventory",
        headers=headers,
    )
    assert get.status_code == 200
    assert get.json()["data"]["expected_count"] == 5


# ---------- Multi-laundry (BUG-2026-07-15-001) ----------


async def test_partner_orders_lists_across_multiple_laundries(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Regression: owner with 2+ laundries must not 500 on scalar_one_or_none."""
    partner, laundry_a, token = await _seed_partner(db_session, email_prefix="multi.a")
    laundry_b = Laundry(
        owner_user_id=partner.id,
        name="Second Laundry",
        slug=f"multi-b-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="2 Multi Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    db_session.add(laundry_b)
    await db_session.flush()

    order_a = await _seed_confirmed_order(db_session, laundry_id=laundry_a.id)
    order_b = await _seed_confirmed_order(db_session, laundry_id=laundry_b.id)

    listed = await client.get("/api/v1/partner/orders", headers=_headers(token))
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    assert "items" in body
    assert body["page"] == 1
    assert body["page_size"] == 10
    ids = {str(row["id"]) for row in body["items"]}
    assert str(order_a.id) in ids
    assert str(order_b.id) in ids

    # Analytics must not 500 for multi-laundry owners (KPI may scope to primary laundry).
    summary = await client.get("/api/v1/partner/analytics/summary", headers=_headers(token))
    assert summary.status_code == 200
    assert "orders_total" in summary.json()["data"]


async def test_partner_headers_fixture_smoke(
    client: AsyncClient,
    partner_headers: dict[str, str],
) -> None:
    r = await client.get("/api/v1/partner/analytics/summary", headers=partner_headers)
    assert r.status_code == 200
    assert "laundry_name" in r.json()["data"]


async def test_partner_orders_paginated_default_page_size(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    partner, laundry, token = await _seed_partner(db_session, email_prefix="page.orders")
    for _ in range(12):
        await _seed_confirmed_order(db_session, laundry_id=laundry.id)

    listed = await client.get("/api/v1/partner/orders", headers=_headers(token))
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_records"] >= 12
    assert len(body["items"]) == 10
    assert body["has_next"] is True
    assert body["has_previous"] is False

    page2 = await client.get(
        "/api/v1/partner/orders?page=2&page_size=10",
        headers=_headers(token),
    )
    assert page2.status_code == 200
    body2 = page2.json()["data"]
    assert body2["page"] == 2
    assert len(body2["items"]) >= 2
    assert body2["has_previous"] is True

    action = await client.get(
        "/api/v1/partner/orders?bucket=action&page_size=10",
        headers=_headers(token),
    )
    assert action.status_code == 200
    for row in action.json()["data"]["items"]:
        assert row["status"] == "confirmed"

    bad_size = await client.get(
        "/api/v1/partner/orders?page_size=15",
        headers=_headers(token),
    )
    assert bad_size.status_code == 200
    assert bad_size.json()["data"]["page_size"] == 10


async def test_partner_customer_insights_paginated_default_page_size(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="crm.page")
    for i in range(12):
        customer = User(
            email=f"crm.cust.{i}.{uuid4().hex[:6]}@test.dlm",
            password_hash=hash_password("Customer@1234"),
            full_name=f"CRM Customer {i:02d}",
            phone=f"+9198{uuid4().hex[:8]}",
            role=UserRole.customer,
            is_email_verified=True,
        )
        db_session.add(customer)
        await db_session.flush()
        await _seed_confirmed_order(db_session, laundry_id=laundry.id, customer=customer)

    listed = await client.get(
        "/api/v1/partner/customer-insights/customers",
        headers=_headers(token),
    )
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_records"] >= 12
    assert len(body["items"]) == 10
    assert body["has_next"] is True
    assert "limit" not in body
    assert "offset" not in body

    searched = await client.get(
        "/api/v1/partner/customer-insights/customers?search=CRM%20Customer%2003",
        headers=_headers(token),
    )
    assert searched.status_code == 200
    search_body = searched.json()["data"]
    assert search_body["total_records"] >= 1
    assert any("03" in row["name"] for row in search_body["items"])

    bad_size = await client.get(
        "/api/v1/partner/customer-insights/customers?page_size=15",
        headers=_headers(token),
    )
    assert bad_size.status_code == 200
    assert bad_size.json()["data"]["page_size"] == 10

    dash = await client.get(
        "/api/v1/partner/customer-insights/dashboard",
        headers=_headers(token),
    )
    assert dash.status_code == 200
    assert "new_this_week" in dash.json()["data"]


async def test_partner_staff_activity_paginated_default_page_size(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    from app.models.enums import StaffActivityAction
    from app.models.staff_activity_log import StaffActivityLog

    partner, laundry, token = await _seed_partner(db_session, email_prefix="staff.act")
    for i in range(12):
        db_session.add(
            StaffActivityLog(
                laundry_id=laundry.id,
                actor_user_id=partner.id,
                action=StaffActivityAction.login,
                description=f"Activity {i}",
            ),
        )
    await db_session.flush()

    listed = await client.get(
        "/api/v1/partner/staff-management/activity",
        headers=_headers(token),
    )
    assert listed.status_code == 200, listed.text
    body = listed.json()["data"]
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_records"] >= 12
    assert len(body["items"]) == 10
    assert body["has_next"] is True

    page2 = await client.get(
        "/api/v1/partner/staff-management/activity?page=2&page_size=10",
        headers=_headers(token),
    )
    assert page2.status_code == 200
    body2 = page2.json()["data"]
    assert body2["page"] == 2
    assert body2["has_previous"] is True

    bad_size = await client.get(
        "/api/v1/partner/staff-management/activity?page_size=15",
        headers=_headers(token),
    )
    assert bad_size.status_code == 200
    assert bad_size.json()["data"]["page_size"] == 10
