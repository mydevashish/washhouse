"""Order events API tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_events_requires_auth(client: AsyncClient) -> None:
    import uuid

    order_id = uuid.uuid4()
    response = await client.get(f"/api/v1/orders/{order_id}/events")
    assert response.status_code == 401
