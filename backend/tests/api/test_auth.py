"""Auth API integration tests."""

from __future__ import annotations

import jwt
import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.server_session import get_server_instance_id

pytestmark = pytest.mark.asyncio


async def test_register_and_login(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@dlm.app",
            "password": "SecurePass123!",
            "full_name": "Test User",
        },
    )
    assert reg.status_code == 201
    reg_body = reg.json()["data"]
    assert reg_body["user"]["email"] == "testuser@dlm.app"
    assert "access_token" in reg_body["tokens"]

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@dlm.app", "password": "SecurePass123!"},
    )
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
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
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


async def test_protected_route_requires_token(client: AsyncClient) -> None:
    me = await client.get("/api/v1/users/me")
    assert me.status_code == 401
    assert me.json()["error"]["code"] == "AUTH_FAILED"


async def test_wrong_role_gets_403(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer403@dlm.app",
            "password": "SecurePass123!",
            "full_name": "Customer Only",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["data"]["tokens"]["access_token"]

    admin_dashboard = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_dashboard.status_code == 403
    assert admin_dashboard.json()["error"]["code"] == "FORBIDDEN"

    me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "customer"
