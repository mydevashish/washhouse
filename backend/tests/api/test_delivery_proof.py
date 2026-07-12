"""Auth guards for delivery proof endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_delivery_proof_get_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/orders/00000000-0000-0000-0000-000000000001/delivery-proof")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delivery_proof_upload_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/partner/orders/00000000-0000-0000-0000-000000000001/delivery-proof",
        files={"file": ("proof.jpg", b"fake", "image/jpeg")},
    )
    assert resp.status_code == 401
