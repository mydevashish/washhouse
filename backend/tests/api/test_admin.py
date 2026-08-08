"""Admin dashboard / list surfaces — Phase 4/5 matrix + BUG-2026-07-14-002 regression."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_admin_dashboard_requires_admin(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    r = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    data = body["data"]
    assert "orders_today" in data or "orders_total" in data
    assert "revenue_month_inr" in data


async def test_admin_dashboard_forbidden_for_customer(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    r = await client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert r.status_code == 403


async def test_admin_dashboard_forbidden_for_partner(
    client: AsyncClient,
    partner_headers: dict[str, str],
) -> None:
    r = await client.get("/api/v1/admin/dashboard", headers=partner_headers)
    assert r.status_code == 403


async def test_admin_paginated_lists_return_200_envelope(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    """Regression: frozen ListQueryParams subclasses must accept status/role filters."""
    paths = (
        "/api/v1/admin/orders?page=1&page_size=10",
        "/api/v1/admin/users?page=1&page_size=10&role=customer",
        "/api/v1/admin/audit-logs?page=1&page_size=10",
        "/api/v1/admin/laundries/pending",
    )
    for path in paths:
        r = await client.get(path, headers=admin_headers)
        assert r.status_code == 200, path
        assert "data" in r.json()


async def test_admin_platform_config_requires_admin(
    client: AsyncClient,
    admin_headers: dict[str, str],
    customer_headers: dict[str, str],
) -> None:
    ok = await client.get("/api/v1/admin/platform-config", headers=admin_headers)
    assert ok.status_code == 200
    assert "data" in ok.json()

    denied = await client.get("/api/v1/admin/platform-config", headers=customer_headers)
    assert denied.status_code == 403


async def test_public_config_online_booking_flag(client: AsyncClient) -> None:
    r = await client.get("/api/v1/config")
    assert r.status_code == 200
    assert "online_booking_enabled" in r.json()["data"]
