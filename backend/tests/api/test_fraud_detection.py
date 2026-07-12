"""Auth guards for fraud detection admin endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_fraud_alerts_list_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/fraud/alerts")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_fraud_summary_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/fraud/summary")
    assert resp.status_code == 401
