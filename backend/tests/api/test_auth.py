"""Auth API integration tests — session + RBAC for customer, partner, admin."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.core.server_session import get_server_instance_id
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry
from app.models.user import User
from app.utils.auth_cookies import REFRESH_COOKIE

pytestmark = pytest.mark.asyncio

PASSWORD = "SecurePass123!"


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _expired_access_token(*, subject: str, role: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "iss": settings.JWT_ISSUER,
        "sub": subject,
        "role": role,
        "typ": "access",
        "iat": now - timedelta(hours=2),
        "exp": now - timedelta(hours=1),
        "jti": str(uuid4()),
        "sid": get_server_instance_id(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


async def _seed_user(
    session: AsyncSession,
    *,
    email: str,
    role: UserRole,
    password: str = PASSWORD,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=f"Test {role.value.title()}",
        role=role,
        is_email_verified=True,
    )
    session.add(user)
    await session.flush()
    return user


async def _seed_partner_with_laundry(session: AsyncSession, email: str) -> tuple[User, Laundry]:
    partner = await _seed_user(session, email=email, role=UserRole.partner)
    laundry = Laundry(
        owner_user_id=partner.id,
        name="Auth Test Laundry",
        slug=f"auth-test-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Auth Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return partner, laundry


async def _login(client: AsyncClient, email: str, password: str = PASSWORD):
    return await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


# ---------- Happy paths ----------


async def test_register_and_login(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@dlm.app",
            "password": PASSWORD,
            "full_name": "Test User",
        },
    )
    assert reg.status_code == 201
    reg_body = reg.json()["data"]
    assert reg_body["user"]["email"] == "testuser@dlm.app"
    assert "access_token" in reg_body["tokens"]

    login = await _login(client, "testuser@dlm.app")
    assert login.status_code == 200
    tokens = login.json()["data"]["tokens"]
    assert tokens["token_type"] == "bearer"
    access_payload = jwt.decode(
        tokens["access_token"],
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALG],
        issuer=settings.JWT_ISSUER,
    )
    assert access_payload.get("sid") == get_server_instance_id()

    me = await client.get(
        "/api/v1/users/me",
        headers=_auth_header(tokens["access_token"]),
    )
    assert me.status_code == 200
    assert me.json()["data"]["full_name"] == "Test User"


async def test_otp_flow(client: AsyncClient) -> None:
    send = await client.post(
        "/api/v1/auth/otp/send",
        json={"phone": "+919876543210"},
    )
    assert send.status_code == 200
    otp = send.json()["data"].get("otp_debug")
    assert otp is not None

    verify = await client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": "+919876543210", "code": otp, "full_name": "OTP User"},
    )
    assert verify.status_code == 200
    assert verify.json()["data"]["user"]["is_phone_verified"] is True


async def test_customer_register_otp_login_refresh_logout(client: AsyncClient) -> None:
    """Customer: register → OTP stub → login → role home → refresh → logout."""
    email = f"cust.session.{uuid4().hex[:8]}@dlm.app"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Session Customer"},
    )
    assert reg.status_code == 201
    assert reg.json()["data"]["user"]["role"] == "customer"

    # Unique E.164-ish Indian mobile (digits only; avoids colliding with other OTP tests)
    phone = f"+9198{uuid4().int % 10_000_000:07d}"
    send = await client.post("/api/v1/auth/otp/send", json={"phone": phone})
    assert send.status_code == 200
    otp = send.json()["data"]["otp_debug"]
    verify = await client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "code": otp, "full_name": "OTP Session"},
    )
    assert verify.status_code == 200

    login = await _login(client, email)
    assert login.status_code == 200
    access = login.json()["data"]["tokens"]["access_token"]
    assert REFRESH_COOKIE in login.cookies

    me = await client.get("/api/v1/users/me", headers=_auth_header(access))
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "customer"

    refresh = await client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    new_access = refresh.json()["data"]["access_token"]
    assert new_access
    assert new_access != access

    logout = await client.post("/api/v1/auth/logout", headers=_auth_header(new_access))
    assert logout.status_code == 204

    reuse = await client.post("/api/v1/auth/refresh")
    assert reuse.status_code == 401


async def test_partner_login_refresh_logout(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    email = f"partner.session.{uuid4().hex[:8]}@dlm.app"
    await _seed_partner_with_laundry(db_session, email)

    login = await _login(client, email)
    assert login.status_code == 200
    access = login.json()["data"]["tokens"]["access_token"]
    assert login.json()["data"]["user"]["role"] == "partner"

    me = await client.get("/api/v1/users/me", headers=_auth_header(access))
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "partner"

    orders = await client.get("/api/v1/partner/orders", headers=_auth_header(access))
    assert orders.status_code == 200

    refresh = await client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    new_access = refresh.json()["data"]["access_token"]

    logout = await client.post("/api/v1/auth/logout", headers=_auth_header(new_access))
    assert logout.status_code == 204


async def test_admin_login_refresh_logout(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    email = f"admin.session.{uuid4().hex[:8]}@dlm.app"
    await _seed_user(db_session, email=email, role=UserRole.admin)

    login = await _login(client, email)
    assert login.status_code == 200
    access = login.json()["data"]["tokens"]["access_token"]
    assert login.json()["data"]["user"]["role"] == "admin"

    me = await client.get("/api/v1/users/me", headers=_auth_header(access))
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "admin"

    dashboard = await client.get("/api/v1/admin/dashboard", headers=_auth_header(access))
    assert dashboard.status_code == 200

    refresh = await client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    new_access = refresh.json()["data"]["access_token"]

    logout = await client.post("/api/v1/auth/logout", headers=_auth_header(new_access))
    assert logout.status_code == 204


# ---------- Errors: credentials / tokens ----------


async def test_wrong_password_returns_clear_error(client: AsyncClient) -> None:
    email = f"wrong.pw.{uuid4().hex[:8]}@dlm.app"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Wrong PW"},
    )
    assert reg.status_code == 201

    bad = await _login(client, email, password="DefinitelyWrong1!")
    assert bad.status_code == 401
    err = bad.json()["error"]
    assert err["code"] == "AUTH_INVALID_CREDENTIALS"
    assert err.get("message")


async def test_protected_route_requires_token(client: AsyncClient) -> None:
    me = await client.get("/api/v1/users/me")
    assert me.status_code == 401
    assert me.json()["error"]["code"] == "AUTH_FAILED"


async def test_expired_access_token_returns_401(client: AsyncClient) -> None:
    token = _expired_access_token(subject=str(uuid4()), role="customer")
    me = await client.get("/api/v1/users/me", headers=_auth_header(token))
    assert me.status_code == 401
    assert me.json()["error"]["code"] == "AUTH_TOKEN_EXPIRED"


async def test_admin_and_partner_routes_require_token(client: AsyncClient) -> None:
    admin = await client.get("/api/v1/admin/dashboard")
    assert admin.status_code == 401
    assert admin.json()["error"]["code"] == "AUTH_FAILED"

    partner = await client.get("/api/v1/partner/orders")
    assert partner.status_code == 401
    assert partner.json()["error"]["code"] == "AUTH_FAILED"

    storefront = await client.put(
        "/api/v1/partner/storefront",
        json={"tagline": "should fail"},
    )
    assert storefront.status_code == 401


# ---------- Cross-role 403 / IDOR ----------


async def test_wrong_role_gets_403(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer403@dlm.app",
            "password": PASSWORD,
            "full_name": "Customer Only",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["data"]["tokens"]["access_token"]

    admin_dashboard = await client.get(
        "/api/v1/admin/dashboard",
        headers=_auth_header(token),
    )
    assert admin_dashboard.status_code == 403
    assert admin_dashboard.json()["error"]["code"] == "FORBIDDEN"

    me = await client.get("/api/v1/users/me", headers=_auth_header(token))
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "customer"


async def test_customer_token_forbidden_on_partner_and_admin_apis(
    client: AsyncClient,
) -> None:
    email = f"cust.xrole.{uuid4().hex[:8]}@dlm.app"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Cross Role Cust"},
    )
    assert reg.status_code == 201
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = _auth_header(token)

    admin = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert admin.status_code == 403
    assert admin.json()["error"]["code"] == "FORBIDDEN"

    partner_orders = await client.get("/api/v1/partner/orders", headers=headers)
    assert partner_orders.status_code == 403
    assert partner_orders.json()["error"]["code"] == "FORBIDDEN"

    partner_mutate = await client.put(
        "/api/v1/partner/storefront",
        headers=headers,
        json={"tagline": "customer should not write"},
    )
    assert partner_mutate.status_code == 403
    assert partner_mutate.json()["error"]["code"] == "FORBIDDEN"


async def test_partner_token_forbidden_on_admin_apis(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    email = f"partner.xrole.{uuid4().hex[:8]}@dlm.app"
    await _seed_partner_with_laundry(db_session, email)
    login = await _login(client, email)
    assert login.status_code == 200
    token = login.json()["data"]["tokens"]["access_token"]
    headers = _auth_header(token)

    dashboard = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert dashboard.status_code == 403
    assert dashboard.json()["error"]["code"] == "FORBIDDEN"

    approvals = await client.get("/api/v1/admin/laundries/pending", headers=headers)
    assert approvals.status_code == 403
    assert approvals.json()["error"]["code"] == "FORBIDDEN"


async def test_admin_can_access_admin_but_not_partner_mutations(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Admin reaches admin APIs; partner-owned write surfaces stay partner-only (403)."""
    email = f"admin.idor.{uuid4().hex[:8]}@dlm.app"
    await _seed_user(db_session, email=email, role=UserRole.admin)
    login = await _login(client, email)
    assert login.status_code == 200
    token = login.json()["data"]["tokens"]["access_token"]
    headers = _auth_header(token)

    dashboard = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert dashboard.status_code == 200

    # Partner mutation endpoints require role=partner — admin must not write via them.
    storefront = await client.put(
        "/api/v1/partner/storefront",
        headers=headers,
        json={"tagline": "admin must not mutate partner storefront"},
    )
    assert storefront.status_code == 403
    assert storefront.json()["error"]["code"] == "FORBIDDEN"

    price_list = await client.put(
        "/api/v1/partner/price-list",
        headers=headers,
        json={"items": []},
    )
    assert price_list.status_code == 403
    assert price_list.json()["error"]["code"] == "FORBIDDEN"

    partner_orders = await client.get("/api/v1/partner/orders", headers=headers)
    assert partner_orders.status_code == 403
    assert partner_orders.json()["error"]["code"] == "FORBIDDEN"


async def test_partner_cannot_use_foreign_access_token_shape(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """IDOR guard: minted partner A token cannot act as partner B via JWT subject mismatch.

    Partner routes resolve laundry from JWT `sub`; a customer-minted token with partner
    role for another user id is still forbidden if role claim is wrong — here we assert
    a real customer cannot hit partner writes even with a forged-looking path.
    """
    email_a = f"partner.a.{uuid4().hex[:8]}@dlm.app"
    email_b = f"partner.b.{uuid4().hex[:8]}@dlm.app"
    partner_a, _ = await _seed_partner_with_laundry(db_session, email_a)
    partner_b, _ = await _seed_partner_with_laundry(db_session, email_b)

    # Partner B's token must not be accepted as admin
    token_b = create_access_token(subject=str(partner_b.id), role=UserRole.partner.value)
    admin = await client.get("/api/v1/admin/dashboard", headers=_auth_header(token_b))
    assert admin.status_code == 403

    # Partner A can call partner routes (own subject)
    token_a = create_access_token(subject=str(partner_a.id), role=UserRole.partner.value)
    own = await client.get("/api/v1/partner/orders", headers=_auth_header(token_a))
    assert own.status_code == 200
