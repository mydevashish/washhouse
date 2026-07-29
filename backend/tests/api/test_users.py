"""Customer profile + address CRUD — Phase 4/5 regression (BUG-012 address edit path)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_me_requires_auth(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/users/me")).status_code == 401
    assert (await client.get("/api/v1/users/me/addresses")).status_code == 401


async def test_get_me_happy(client: AsyncClient, customer_headers: dict[str, str]) -> None:
    resp = await client.get("/api/v1/users/me", headers=customer_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["role"] == "customer"
    assert data["email"].endswith("@test.dlm")


async def test_address_crud_happy_path(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    # Keep a default address so the non-default one can be deleted.
    default = await client.post(
        "/api/v1/users/me/addresses",
        headers=customer_headers,
        json={
            "label": "Default",
            "line1": "1 Default Lane",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "is_default": True,
        },
    )
    assert default.status_code == 201, default.text

    create = await client.post(
        "/api/v1/users/me/addresses",
        headers=customer_headers,
        json={
            "label": "Office",
            "line1": "42 Test Lane",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "is_default": False,
        },
    )
    assert create.status_code == 201, create.text
    address_id = create.json()["data"]["id"]
    assert create.json()["data"]["line1"] == "42 Test Lane"

    listed = await client.get("/api/v1/users/me/addresses", headers=customer_headers)
    assert listed.status_code == 200
    assert any(row["id"] == address_id for row in listed.json()["data"])

    patched = await client.patch(
        f"/api/v1/users/me/addresses/{address_id}",
        headers=customer_headers,
        json={"line1": "42 Test Lane, Updated"},
    )
    assert patched.status_code == 200
    assert patched.json()["data"]["line1"] == "42 Test Lane, Updated"

    deleted = await client.delete(
        f"/api/v1/users/me/addresses/{address_id}",
        headers=customer_headers,
    )
    assert deleted.status_code == 204

    after = await client.get("/api/v1/users/me/addresses", headers=customer_headers)
    assert all(row["id"] != address_id for row in after.json()["data"])


async def test_cannot_delete_sole_default_address(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    create = await client.post(
        "/api/v1/users/me/addresses",
        headers=customer_headers,
        json={
            "label": "Only",
            "line1": "9 Only St",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "is_default": True,
        },
    )
    assert create.status_code == 201
    address_id = create.json()["data"]["id"]
    deleted = await client.delete(
        f"/api/v1/users/me/addresses/{address_id}",
        headers=customer_headers,
    )
    assert deleted.status_code == 422


async def test_address_create_validation_422(
    client: AsyncClient,
    customer_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/users/me/addresses",
        headers=customer_headers,
        json={
            "label": "Bad",
            "line1": "x",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "56",  # not 6 digits
        },
    )
    assert resp.status_code == 422


async def test_address_idor_other_customer_404(
    client: AsyncClient,
    customer_headers: dict[str, str],
    admin_headers: dict[str, str],
) -> None:
    create = await client.post(
        "/api/v1/users/me/addresses",
        headers=customer_headers,
        json={
            "label": "Mine",
            "line1": "1 Private St",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
        },
    )
    assert create.status_code == 201
    address_id = create.json()["data"]["id"]

    # Admin is a different user — must not mutate customer address via /users/me
    patch = await client.patch(
        f"/api/v1/users/me/addresses/{address_id}",
        headers=admin_headers,
        json={"line1": "Hijacked"},
    )
    assert patch.status_code == 404

    delete = await client.delete(
        f"/api/v1/users/me/addresses/{address_id}",
        headers=admin_headers,
    )
    assert delete.status_code == 404

    missing = await client.patch(
        f"/api/v1/users/me/addresses/{uuid4()}",
        headers=customer_headers,
        json={"line1": "Nope"},
    )
    assert missing.status_code == 404
