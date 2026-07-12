"""Review API tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_reviews_empty(client: AsyncClient) -> None:
    import uuid

    laundry_id = uuid.uuid4()
    response = await client.get(f"/api/v1/laundries/{laundry_id}/reviews")
    assert response.status_code == 404
