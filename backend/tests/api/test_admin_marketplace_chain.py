"""Admin marketplace chain + admin surface / RBAC integration tests (Anita).

Covers: partner register → pending → approve → discover → order → accept →
complete → admin order/revenue/commission impact; complaints resolve; 403 gates.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.enums import (
    AuditAction,
    ComplaintStatus,
    ComplaintType,
    LaundryStatus,
    OrderStatus,
    UserRole,
)
from app.models.laundry import LaundryService
from app.models.user import User
from app.models.user_address import UserAddress

pytestmark = pytest.mark.asyncio

PASSWORD = "SecurePass123!"


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _seed_user(
    session: AsyncSession,
    *,
    role: UserRole,
    email_prefix: str,
) -> User:
    user = User(
        email=f"{email_prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password(PASSWORD),
        full_name=f"Test {role.value}",
        role=role,
        is_email_verified=True,
    )
    session.add(user)
    await session.flush()
    return user


def _token_for(user: User) -> str:
    return create_access_token(subject=str(user.id), role=user.role.value)


# Core admin read surfaces that customer/partner must not access.
_ADMIN_GET_PATHS = (
    "/api/v1/admin/dashboard",
    "/api/v1/admin/analytics?days=14",
    "/api/v1/admin/laundries/pending",
    "/api/v1/admin/laundries/management",
    "/api/v1/admin/laundries",
    "/api/v1/admin/orders",
    "/api/v1/admin/users?role=customer",
    "/api/v1/admin/audit-logs",
    "/api/v1/admin/commission/default",
    "/api/v1/complaints/admin/list",
)


# ---------- RBAC ----------


async def test_customer_and_partner_get_403_on_all_admin_surfaces(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    customer = await _seed_user(db_session, role=UserRole.customer, email_prefix="cust.adminforbid")
    partner = await _seed_user(db_session, role=UserRole.partner, email_prefix="part.adminforbid")
    cust_h = _headers(_token_for(customer))
    part_h = _headers(_token_for(partner))

    for path in _ADMIN_GET_PATHS:
        assert (await client.get(path, headers=cust_h)).status_code == 403, path
        assert (await client.get(path, headers=part_h)).status_code == 403, path

    laundry_id = uuid4()
    complaint_id = uuid4()
    mutations = (
        ("POST", f"/api/v1/admin/laundries/{laundry_id}/approve", None),
        ("POST", f"/api/v1/admin/laundries/{laundry_id}/reject", None),
        ("PATCH", f"/api/v1/admin/laundries/{laundry_id}/commission", {"rate": "12.5"}),
        ("PUT", "/api/v1/admin/commission/default", {"rate": "10"}),
        (
            "PATCH",
            f"/api/v1/complaints/admin/{complaint_id}/status",
            {"status": ComplaintStatus.resolved.value, "admin_notes": "ok"},
        ),
    )
    for method, path, body in mutations:
        for headers in (cust_h, part_h):
            resp = await client.request(method, path, headers=headers, json=body)
            assert resp.status_code == 403, f"{method} {path}"


# ---------- Cross-role marketplace chain ----------


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
@patch.object(settings, "FEATURE_ONLINE_BOOKING", True)
async def test_admin_marketplace_approval_order_commission_chain(
    mock_whatsapp: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Partner registers → admin approves → customer orders → partner completes → admin impact."""
    mock_whatsapp.delay = MagicMock()

    # 1. Future partner registers as customer, then registers laundry (pending).
    owner = await _seed_user(db_session, role=UserRole.customer, email_prefix="chain.owner")
    owner_h = _headers(_token_for(owner))

    slug_name = f"Chain Laundry {uuid4().hex[:6]}"
    reg = await client.post(
        "/api/v1/partner/laundries",
        headers=owner_h,
        json={
            "name": slug_name,
            "city": "Bengaluru",
            "address_line": "42 Chain Road, Koramangala, 560034",
            "description": "Pending marketplace partner",
        },
    )
    assert reg.status_code == 201, reg.text
    laundry_uuid = UUID(str(reg.json()["data"]["id"]))
    laundry_id = str(laundry_uuid)
    # Public detail schema omits status; pending queue is the source of truth.

    # Role flips to partner — refresh token for subsequent partner calls.
    await db_session.refresh(owner)
    assert owner.role == UserRole.partner
    partner_h = _headers(create_access_token(subject=str(owner.id), role=UserRole.partner.value))

    # Seed a service so orders can be placed after approval.
    service = LaundryService(
        laundry_id=laundry_uuid,
        name="Wash & Fold",
        category="wash",
        unit="kg",
        price_inr=Decimal("100.00"),
        is_active=True,
        catalog_status="active",
    )
    db_session.add(service)
    await db_session.flush()

    admin = await _seed_user(db_session, role=UserRole.admin, email_prefix="chain.admin")
    admin_h = _headers(_token_for(admin))
    customer = await _seed_user(db_session, role=UserRole.customer, email_prefix="chain.cust")
    customer_h = _headers(_token_for(customer))
    address = UserAddress(
        user_id=customer.id,
        label="Home",
        line1="9 Customer Lane",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
        is_default=True,
    )
    db_session.add(address)
    await db_session.flush()

    # 2. Pending laundry is not discoverable / not orderable.
    public = await client.get("/api/v1/laundries")
    assert public.status_code == 200
    assert laundry_id not in {str(row["id"]) for row in public.json()["data"]}

    now = datetime.now(UTC)
    blocked = await client.post(
        "/api/v1/orders",
        headers=customer_h,
        json={
            "laundry_id": laundry_id,
            "address_id": str(address.id),
            "pickup_at": (now + timedelta(days=1)).isoformat(),
            "delivery_at": (now + timedelta(days=2)).isoformat(),
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert blocked.status_code in (404, 409, 422)

    pending = await client.get("/api/v1/admin/laundries/pending", headers=admin_h)
    assert pending.status_code == 200
    assert laundry_id in {str(row["id"]) for row in pending.json()["data"]}

    # 3. Admin reject sibling laundry (API + audit; FE confirmation covers UX).
    reject_owner = await _seed_user(db_session, role=UserRole.customer, email_prefix="chain.reject")
    reject_reg = await client.post(
        "/api/v1/partner/laundries",
        headers=_headers(_token_for(reject_owner)),
        json={
            "name": f"Reject Me {uuid4().hex[:6]}",
            "city": "Bengaluru",
            "address_line": "1 Reject Road, Indiranagar",
        },
    )
    assert reject_reg.status_code == 201
    reject_id = reject_reg.json()["data"]["id"]
    rejected = await client.post(
        f"/api/v1/admin/laundries/{reject_id}/reject",
        headers=admin_h,
    )
    assert rejected.status_code == 200
    assert rejected.json()["data"]["status"] == LaundryStatus.rejected.value

    # 4. Approve primary laundry → discoverable.
    approved = await client.post(
        f"/api/v1/admin/laundries/{laundry_id}/approve",
        headers=admin_h,
    )
    assert approved.status_code == 200
    assert approved.json()["data"]["status"] == LaundryStatus.approved.value

    public2 = await client.get("/api/v1/laundries")
    assert laundry_id in {str(row["id"]) for row in public2.json()["data"]}

    audit = await client.get(
        "/api/v1/admin/audit-logs",
        headers=admin_h,
        params={"page": 1, "page_size": 50},
    )
    assert audit.status_code == 200
    audit_actions = {row["action"] for row in audit.json()["data"]["items"]}
    assert AuditAction.laundry_approved.value in audit_actions
    assert AuditAction.laundry_rejected.value in audit_actions

    # 5. Commission override + customer order.
    commission = await client.patch(
        f"/api/v1/admin/laundries/{laundry_id}/commission",
        headers=admin_h,
        json={"rate": "15.00"},
    )
    assert commission.status_code == 200
    assert commission.json()["data"]["commission_rate"] == "15.00"

    order_resp = await client.post(
        "/api/v1/orders",
        headers=customer_h,
        json={
            "laundry_id": laundry_id,
            "address_id": str(address.id),
            "pickup_at": (now + timedelta(days=1)).isoformat(),
            "delivery_at": (now + timedelta(days=2)).isoformat(),
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order = order_resp.json()["data"]
    order_id = order["id"]
    assert order["status"] == OrderStatus.confirmed.value

    # 6. Partner accepts online order, then completes a walk-in for delivered impact.
    accept = await client.post(
        f"/api/v1/partner/orders/{order_id}/accept",
        headers=partner_h,
    )
    assert accept.status_code == 200
    assert accept.json()["data"]["status"] == OrderStatus.pickup_assigned.value

    walk_in = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=partner_h,
        json={
            "customer_name": "Walk-in Chain",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 1}],
        },
    )
    assert walk_in.status_code == 201, walk_in.text
    walk_id = walk_in.json()["data"]["id"]
    for status in (OrderStatus.washing, OrderStatus.ready, OrderStatus.delivered):
        step = await client.patch(
            f"/api/v1/partner/orders/{walk_id}/status",
            headers=partner_h,
            json={"status": status.value},
        )
        assert step.status_code == 200, step.text
        assert step.json()["data"]["status"] == status.value

    # 7. Admin surfaces show order + KPI impact; management list has commission.
    admin_orders = await client.get("/api/v1/admin/orders", headers=admin_h)
    assert admin_orders.status_code == 200
    order_ids = {str(row["id"]) for row in admin_orders.json()["data"]["items"]}
    assert order_id in order_ids
    assert str(walk_id) in order_ids

    dashboard = await client.get("/api/v1/admin/dashboard", headers=admin_h)
    assert dashboard.status_code == 200
    dash = dashboard.json()["data"]
    assert int(dash["orders_today"]) >= 1 or int(dash.get("orders_total", 0)) >= 1
    assert "revenue_month_inr" in dash
    assert "commission_month_inr" in dash

    analytics = await client.get("/api/v1/admin/analytics?days=14", headers=admin_h)
    assert analytics.status_code == 200

    management = await client.get("/api/v1/admin/laundries/management", headers=admin_h)
    assert management.status_code == 200
    management_rows = management.json()["data"]["items"]
    row = next(r for r in management_rows if str(r["id"]) == laundry_id)
    assert row["custom_commission_rate"] == "15.00"
    assert row["effective_commission_rate"] == "15.00"

    users = await client.get("/api/v1/admin/users", headers=admin_h, params={"role": "customer"})
    assert users.status_code == 200
    assert users.json()["data"]["total_records"] >= 1

    # 8. Complaints queue → resolve with notes.
    complaint = await client.post(
        "/api/v1/complaints",
        headers=customer_h,
        data={
            "order_id": order_id,
            "complaint_type": ComplaintType.delayed_delivery.value,
            "description": "Pickup was delayed beyond the promised window for this order.",
        },
    )
    assert complaint.status_code == 201, complaint.text
    complaint_id = complaint.json()["data"]["id"]

    queue = await client.get("/api/v1/complaints/admin/list", headers=admin_h)
    assert queue.status_code == 200
    assert str(complaint_id) in {str(row["id"]) for row in queue.json()["data"]}

    resolved = await client.patch(
        f"/api/v1/complaints/admin/{complaint_id}/status",
        headers=admin_h,
        json={
            "status": ComplaintStatus.resolved.value,
            "admin_notes": "Partner apologized; goodwill credit issued.",
            "note": "Resolved after partner confirmation",
        },
    )
    assert resolved.status_code == 200, resolved.text
    body = resolved.json()["data"]
    assert body["status"] == ComplaintStatus.resolved.value
    assert "goodwill" in (body.get("admin_notes") or "").lower()
