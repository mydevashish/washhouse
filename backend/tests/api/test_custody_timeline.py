"""Auth guards for custody timeline endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_custody_timeline_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/orders/00000000-0000-0000-0000-000000000001/custody-timeline")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_partner_custody_timeline_requires_auth(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/v1/partner/orders/00000000-0000-0000-0000-000000000001/custody-timeline",
    )
    assert resp.status_code == 401
