# Template: Pytest test module
# Save as: backend/tests/<area>/test_<thing>.py
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestList<Resource>s:
    async def test_requires_auth(self, client: AsyncClient) -> None:
        r = await client.get("/api/v1/<resource_plural>")
        assert r.status_code == 401

    async def test_returns_only_my_items(self, customer_client, <resource>_factory, other_user) -> None:
        <resource>_factory.create(user=customer_client.user)
        <resource>_factory.create(user=other_user)
        r = await customer_client.get("/api/v1/<resource_plural>")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1


class TestCreate<Resource>:
    async def test_creates_successfully(self, customer_client) -> None:
        r = await customer_client.post("/api/v1/<resource_plural>", json={
            "name": "Sample",
        })
        assert r.status_code == 201

    async def test_rejects_extra_fields(self, customer_client) -> None:
        r = await customer_client.post("/api/v1/<resource_plural>", json={
            "name": "Sample",
            "secret_field": "x",
        })
        assert r.status_code == 422


class TestGet<Resource>:
    async def test_returns_404_for_other_user(self, customer_a_client, customer_b_resource) -> None:
        r = await customer_a_client.get(f"/api/v1/<resource_plural>/{customer_b_resource.id}")
        assert r.status_code == 404  # don't leak existence
