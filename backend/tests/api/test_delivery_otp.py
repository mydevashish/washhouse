"""Delivery OTP API tests."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_delivery_otp_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    response = await client.get(f"/api/v1/orders/{order_id}/delivery-otp")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delivery_verify_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    response = await client.post(
        f"/api/v1/partner/orders/{order_id}/delivery/verify",
        json={"code": "123456"},
    )
    assert response.status_code == 401
