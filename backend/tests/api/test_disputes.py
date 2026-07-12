"""Auth guards for dispute endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_disputes_list_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/complaints")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_disputes_admin_list_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/complaints/admin/list")
    assert resp.status_code == 401
