"""Inventory verification API tests."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_inventory_verification_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    response = await client.get(f"/api/v1/orders/{order_id}/inventory-verification")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_partner_inventory_record_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    response = await client.put(
        f"/api/v1/partner/orders/{order_id}/inventory-verification",
        json={"items": {"shirts": 2, "trousers": 0, "sarees": 0, "jackets": 0, "bedsheets": 0, "blankets": 0, "curtains": 0, "other": 0}},
    )
    assert response.status_code == 401
