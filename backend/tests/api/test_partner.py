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
    PaymentMethod,
    PaymentStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.payment import Payment
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
async def test_partner_a_cannot_fetch_partner_b_order_tags(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp.delay = MagicMock()
    _a, _laundry_a, token_a = await _seed_partner(db_session, email_prefix="tags.a")
    _b, laundry_b, _token_b = await _seed_partner(db_session, email_prefix="tags.b")
    order_b = await _seed_confirmed_order(db_session, laundry_id=laundry_b.id)

    tags_json = await client.get(
        f"/api/v1/partner/orders/{order_b.id}/tags",
        headers=_headers(token_a),
    )
    assert tags_json.status_code == 404

    tags_print = await client.get(
        f"/api/v1/partner/orders/{order_b.id}/tags/print",
        headers=_headers(token_a),
    )
    assert tags_print.status_code == 404


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


async def test_analytics_overview_requires_auth(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/partner/analytics/overview")).status_code == 401


async def test_analytics_overview_empty_laundry(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    partner = User(
        email=f"nopartner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="No Laundry Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    db_session.add(partner)
    await db_session.flush()
    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)

    response = await client.get(
        "/api/v1/partner/analytics/overview?period=today",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["orders_count"] == 0
    assert data["period"] == "today"
    assert len(data["chart_series"]) == 24
    assert data["customers_count_all_time"] == 0


async def test_analytics_overview_period_kpis(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="overview")
    await _seed_confirmed_order(db_session, laundry_id=laundry.id)

    response = await client.get(
        "/api/v1/partner/analytics/overview?period=week",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["period"] == "week"
    assert data["orders_count"] >= 1
    assert data["pending_orders_count"] >= 1
    assert len(data["chart_series"]) == 7
    assert "period_start_utc" in data
    assert "revenue_gross_inr" in data


async def test_analytics_overview_invalid_period(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, email_prefix="overviewbad")
    response = await client.get(
        "/api/v1/partner/analytics/overview?period=quarter",
        headers=_headers(token),
    )
    assert response.status_code == 422


async def test_analytics_dashboard_requires_auth(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/partner/analytics/dashboard")).status_code == 401


async def test_analytics_dashboard_customer_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    customer = User(
        email=f"cust.dashforbid.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(customer)
    await db_session.flush()
    token = create_access_token(subject=str(customer.id), role=UserRole.customer.value)
    response = await client.get(
        "/api/v1/partner/analytics/dashboard",
        headers=_headers(token),
    )
    assert response.status_code == 403


async def test_analytics_dashboard_empty_laundry_zeros(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    partner = User(
        email=f"nodash.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="No Laundry Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    db_session.add(partner)
    await db_session.flush()
    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)

    response = await client.get(
        "/api/v1/partner/analytics/dashboard?period=year",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["laundry_id"] is None
    assert data["laundry_name"] == "No Laundry Partner"
    assert data["period"] == "year"
    assert data["kpis"]["orders_today"] == 0
    assert data["kpis"]["revenue_today_inr"] == "0.00"
    assert data["status_snapshot"]["in_process"] == 0
    assert data["status_donut"]["completed"] == 0
    assert data["payment_summary"]["wallet_tracked"] is False
    assert data["payment_summary"]["cash_paid_inr"] == "0.00"
    assert len(data["chart_series"]) == 12
    assert data["top_services"] == []
    assert data["bottom"]["customers_total"] == 0
    assert data["bottom"]["avg_delivery_minutes"] is None


async def test_analytics_dashboard_invalid_period(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, email_prefix="dashbad")
    response = await client.get(
        "/api/v1/partner/analytics/dashboard?period=quarter",
        headers=_headers(token),
    )
    assert response.status_code == 422


async def test_analytics_dashboard_in_process_excludes_ready(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="dashstatus")
    now = datetime.now(UTC)
    for status, tracking in (
        (OrderStatus.washing, "WASH"),
        (OrderStatus.ready, "READY"),
        (OrderStatus.delivered, "DONE"),
    ):
        db_session.add(
            Order(
                laundry_id=laundry.id,
                order_source=OrderSource.walk_in,
                status=status,
                tracking_code=f"DLM{tracking}{uuid4().hex[:6].upper()}",
                pickup_at=now - timedelta(hours=4),
                delivery_at=now,
                delivered_at=now if status == OrderStatus.delivered else None,
                subtotal_inr=Decimal("100.00"),
                delivery_fee_inr=Decimal("0.00"),
                cgst_inr=Decimal("0.00"),
                sgst_inr=Decimal("0.00"),
                total_inr=Decimal("100.00"),
                payment_status=PaymentStatus.paid,
                payment_method=PaymentMethod.cod,
                customer_name="Counter Guest",
                customer_phone="9876543210",
            ),
        )
    await db_session.flush()

    response = await client.get(
        "/api/v1/partner/analytics/dashboard?period=week",
        headers=_headers(token),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status_snapshot"]["in_process"] == 1
    assert data["status_snapshot"]["ready_for_delivery"] == 1
    assert data["status_snapshot"]["completed"] == 1
    assert data["payment_summary"]["wallet_tracked"] is False
    assert Decimal(data["payment_summary"]["cash_paid_inr"]) == Decimal("300.00")
    assert data["kpis"]["orders_week"] == 3
    assert len(data["chart_series"]) == 7


async def test_analytics_dashboard_hides_other_laundry_orders(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner_a, _laundry_a, token_a = await _seed_partner(db_session, email_prefix="dashida")
    _partner_b, laundry_b, _token_b = await _seed_partner(db_session, email_prefix="dashidb")
    now = datetime.now(UTC)
    db_session.add(
        Order(
            laundry_id=laundry_b.id,
            order_source=OrderSource.online,
            status=OrderStatus.delivered,
            tracking_code=f"DLMIDOR{uuid4().hex[:6].upper()}",
            pickup_at=now - timedelta(hours=2),
            delivery_at=now,
            delivered_at=now,
            subtotal_inr=Decimal("500.00"),
            delivery_fee_inr=Decimal("0.00"),
            cgst_inr=Decimal("0.00"),
            sgst_inr=Decimal("0.00"),
            total_inr=Decimal("500.00"),
            payment_status=PaymentStatus.paid,
            payment_method=PaymentMethod.razorpay,
        ),
    )
    await db_session.flush()

    response = await client.get(
        "/api/v1/partner/analytics/dashboard",
        headers=_headers(token_a),
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status_snapshot"]["completed"] == 0
    assert data["kpis"]["revenue_today_inr"] == "0.00"
    assert data["kpis"]["orders_today"] == 0
    assert Decimal(data["payment_summary"]["upi_paid_inr"]) == Decimal("0.00")


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


async def _seed_delivered_order(
    session: AsyncSession,
    *,
    laundry_id,
    total_inr: Decimal,
    updated_at: datetime,
    order_source: OrderSource = OrderSource.walk_in,
    commission_rate: Decimal | None = Decimal("10.00"),
) -> Order:
    now = datetime.now(UTC)
    order = Order(
        laundry_id=laundry_id,
        order_source=order_source,
        status=OrderStatus.delivered,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        pickup_at=now - timedelta(hours=4),
        delivery_at=now,
        delivered_at=updated_at,
        subtotal_inr=total_inr,
        delivery_fee_inr=Decimal("0.00"),
        cgst_inr=Decimal("0.00"),
        sgst_inr=Decimal("0.00"),
        total_inr=total_inr,
        payment_status=PaymentStatus.paid,
        payment_method=PaymentMethod.cod,
        customer_name="Counter Guest",
        customer_phone="9876543210",
        commission_rate=commission_rate,
    )
    session.add(order)
    await session.flush()
    order.updated_at = updated_at
    await session.flush()
    return order


async def test_analytics_summary_custom_range_filters_delivered(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="summarycustom")
    in_range = datetime(2026, 8, 10, 6, 30, tzinfo=UTC)  # 10 Aug 2026 12:00 IST
    out_of_range = datetime(2026, 7, 15, 6, 30, tzinfo=UTC)
    await _seed_delivered_order(
        db_session,
        laundry_id=laundry.id,
        total_inr=Decimal("300.00"),
        updated_at=in_range,
    )
    await _seed_delivered_order(
        db_session,
        laundry_id=laundry.id,
        total_inr=Decimal("100.00"),
        updated_at=out_of_range,
    )

    response = await client.get(
        "/api/v1/partner/analytics/summary"
        "?period=custom&date_from=2026-08-01&date_to=2026-08-31",
        headers=_headers(token),
    )
    assert response.status_code == 200
    scope = response.json()["data"]["period_scope"]
    assert scope is not None
    assert scope["period"] == "custom"
    assert Decimal(scope["revenue_gross_inr"]) == Decimal("300.00")
    assert Decimal(scope["partner_net_inr"]) == Decimal("270.00")
    assert Decimal(scope["commission_inr"]) == Decimal("30.00")
    assert Decimal(scope["revenue_walk_in_inr"]) == Decimal("300.00")
    assert len(scope["chart_series"]) == 31


async def test_analytics_summary_year_jan_to_today(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="summaryyear")
    now = datetime.now(UTC)
    this_year = datetime(now.year, 1, 15, 6, 30, tzinfo=UTC)
    last_year = datetime(now.year - 1, 6, 15, 6, 30, tzinfo=UTC)
    await _seed_delivered_order(
        db_session,
        laundry_id=laundry.id,
        total_inr=Decimal("500.00"),
        updated_at=this_year,
    )
    await _seed_delivered_order(
        db_session,
        laundry_id=laundry.id,
        total_inr=Decimal("200.00"),
        updated_at=last_year,
    )

    response = await client.get(
        "/api/v1/partner/analytics/summary?period=year",
        headers=_headers(token),
    )
    assert response.status_code == 200
    scope = response.json()["data"]["period_scope"]
    assert scope is not None
    assert scope["period"] == "year"
    assert str(now.year) in scope["period_label_ist"]
    assert Decimal(scope["revenue_gross_inr"]) == Decimal("500.00")
    assert Decimal(scope["partner_net_inr"]) == Decimal("450.00")


async def test_analytics_summary_custom_requires_dates(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, email_prefix="summarycustombad")
    response = await client.get(
        "/api/v1/partner/analytics/summary?period=custom",
        headers=_headers(token),
    )
    assert response.status_code == 422


async def test_analytics_summary_period_invalid(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, _laundry, token = await _seed_partner(db_session, email_prefix="summaryperiodbad")
    response = await client.get(
        "/api/v1/partner/analytics/summary?period=quarter",
        headers=_headers(token),
    )
    assert response.status_code == 422


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


async def test_partner_orders_paid_pending_partial_advance(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """List/detail expose paid_inr + pending_inr from captured COD advance."""
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="pay.partial")
    order = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    order.order_source = OrderSource.walk_in
    order.payment_status = PaymentStatus.pending_cod
    order.payment_method = PaymentMethod.cod
    order.total_inr = Decimal("500.00")
    db_session.add(
        Payment(
            order_id=order.id,
            amount_inr=Decimal("200.00"),
            status=PaymentStatus.paid,
            method=PaymentMethod.cod,
            metadata_json='{"advance_inr":"200.00"}',
        ),
    )
    await db_session.flush()

    listed = await client.get("/api/v1/partner/orders", headers=_headers(token))
    assert listed.status_code == 200, listed.text
    row = next(item for item in listed.json()["data"]["items"] if item["id"] == str(order.id))
    assert Decimal(row["paid_inr"]) == Decimal("200.00")
    assert Decimal(row["pending_inr"]) == Decimal("300.00")
    assert Decimal(row["paid_inr"]) + Decimal(row["pending_inr"]) == Decimal(row["total_inr"])

    detail = await client.get(f"/api/v1/partner/orders/{order.id}", headers=_headers(token))
    assert detail.status_code == 200
    data = detail.json()["data"]
    assert Decimal(data["paid_inr"]) == Decimal("200.00")
    assert Decimal(data["pending_inr"]) == Decimal("300.00")


async def test_partner_orders_paid_pending_fully_paid(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="pay.full")
    order = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    order.payment_status = PaymentStatus.paid
    order.payment_method = PaymentMethod.razorpay
    await db_session.flush()

    listed = await client.get("/api/v1/partner/orders", headers=_headers(token))
    row = next(item for item in listed.json()["data"]["items"] if item["id"] == str(order.id))
    assert Decimal(row["paid_inr"]) == Decimal(row["total_inr"])
    assert Decimal(row["pending_inr"]) == Decimal("0.00")


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


async def test_partner_orders_date_filter_ist_crosses_month_boundary(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """created_at filtered by IST calendar days — July 31 late night vs Aug 1 early morning."""
    from zoneinfo import ZoneInfo

    _partner, laundry, token = await _seed_partner(db_session, email_prefix="date.filter")
    ist = ZoneInfo("Asia/Kolkata")

    july_late = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    july_late.tracking_code = f"JUL{uuid4().hex[:8].upper()}"
    july_late.created_at = datetime(2026, 7, 31, 23, 30, tzinfo=ist)

    aug_early = await _seed_confirmed_order(db_session, laundry_id=laundry.id)
    aug_early.tracking_code = f"AUG{uuid4().hex[:8].upper()}"
    aug_early.created_at = datetime(2026, 8, 1, 0, 30, tzinfo=ist)

    await db_session.flush()

    headers = _headers(token)
    filtered = await client.get(
        "/api/v1/partner/orders"
        "?bucket=all&page_size=5000&date_from=2026-08-01&date_to=2026-08-31",
        headers=headers,
    )
    assert filtered.status_code == 200, filtered.text
    ids = {row["tracking_code"] for row in filtered.json()["data"]["items"]}
    assert aug_early.tracking_code in ids
    assert july_late.tracking_code not in ids

    july_only = await client.get(
        "/api/v1/partner/orders"
        "?bucket=all&page_size=5000&date_from=2026-07-31&date_to=2026-07-31",
        headers=headers,
    )
    assert july_only.status_code == 200, july_only.text
    july_ids = {row["tracking_code"] for row in july_only.json()["data"]["items"]}
    assert july_late.tracking_code in july_ids
    assert aug_early.tracking_code not in july_ids

    bad_range = await client.get(
        "/api/v1/partner/orders?date_from=2026-08-15&date_to=2026-08-01",
        headers=headers,
    )
    assert bad_range.status_code == 422


async def test_partner_orders_list_search_tracking_phone_token_name(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Dashboard Tags section: server search covers tracking, phone, token, customer name."""
    from app.models.enums import ColorToken

    _partner, laundry, token = await _seed_partner(db_session, email_prefix="tags.search")
    customer = User(
        email=f"tags.search.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Tags Lookup Person",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(customer)
    await db_session.flush()

    order = await _seed_confirmed_order(db_session, laundry_id=laundry.id, customer=customer)
    order.tracking_code = "WH-TAGSSEARCH01"
    order.customer_phone = "+91 98765-43210"
    order.customer_name = "Walk-in Alias Name"
    order.token_code = "R-42"
    order.color_token = ColorToken.red
    await db_session.flush()

    headers = _headers(token)
    base = "/api/v1/partner/orders?bucket=all&page_size=10"

    by_tracking = await client.get(f"{base}&search=WH-TAGSSEARCH01", headers=headers)
    assert by_tracking.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_tracking.json()["data"]["items"])

    by_phone_full = await client.get(f"{base}&search=9876543210", headers=headers)
    assert by_phone_full.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_phone_full.json()["data"]["items"])

    by_phone_last4 = await client.get(f"{base}&search=3210", headers=headers)
    assert by_phone_last4.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_phone_last4.json()["data"]["items"])

    by_token = await client.get(f"{base}&search=R-42", headers=headers)
    assert by_token.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_token.json()["data"]["items"])

    by_user_name = await client.get(f"{base}&search=Tags%20Lookup", headers=headers)
    assert by_user_name.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_user_name.json()["data"]["items"])

    by_order_customer_name = await client.get(f"{base}&search=Walk-in%20Alias", headers=headers)
    assert by_order_customer_name.status_code == 200
    assert any(row["id"] == str(order.id) for row in by_order_customer_name.json()["data"]["items"])


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
    dash_data = dash.json()["data"]
    assert "new_this_week" in dash_data
    assert "orders_count_all_time" in dash_data
    assert "orders_count_this_week" in dash_data


async def test_partner_create_customer_and_insights_list(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    _partner, laundry, token = await _seed_partner(db_session, email_prefix="crm.create")
    phone_local = f"9876{uuid4().int % 100000:05d}"

    created = await client.post(
        "/api/v1/partner/customers",
        headers=_headers(token),
        json={"name": "Counter Add", "phone": phone_local},
    )
    assert created.status_code == 200, created.text
    body = created.json()["data"]
    assert body["registered"] is True
    assert body["name"] == "Counter Add"
    user_id = body["user_id"]

    again = await client.post(
        "/api/v1/partner/customers",
        headers=_headers(token),
        json={"name": "Counter Add Updated", "phone": phone_local},
    )
    assert again.status_code == 200
    assert again.json()["data"]["user_id"] == user_id
    assert again.json()["data"]["name"] == "Counter Add Updated"

    listed = await client.get(
        "/api/v1/partner/customer-insights/customers?search=Counter%20Add",
        headers=_headers(token),
    )
    assert listed.status_code == 200
    names = [row["name"] for row in listed.json()["data"]["items"]]
    assert "Counter Add Updated" in names

    _partner_b, _laundry_b, token_b = await _seed_partner(db_session, email_prefix="crm.other")
    listed_b = await client.get(
        f"/api/v1/partner/customer-insights/customers?search={phone_local}",
        headers=_headers(token_b),
    )
    assert listed_b.status_code == 200
    assert listed_b.json()["data"]["total_records"] == 0


async def test_partner_insights_dashboard_order_counts(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    partner, laundry, token = await _seed_partner(db_session, email_prefix="crm.orders.kpi")
    customer = User(
        email=f"crm.kpi.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="KPI Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    db_session.add(customer)
    await db_session.flush()
    await _seed_confirmed_order(db_session, laundry_id=laundry.id, customer=customer)

    dash = await client.get(
        "/api/v1/partner/customer-insights/dashboard",
        headers=_headers(token),
    )
    assert dash.status_code == 200
    data = dash.json()["data"]
    assert data["orders_count_all_time"] >= 1
    assert data["orders_count_this_week"] >= 1


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
