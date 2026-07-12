"""Auth guards for trust score admin endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_trust_scores_list_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/trust-scores")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_trust_score_detail_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/trust-scores/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 401
