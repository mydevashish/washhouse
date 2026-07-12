"""Pickup evidence API tests."""

from __future__ import annotations

import io
import uuid

import pytest
from httpx import AsyncClient
from PIL import Image


def _make_jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=(120, 80, 200)).save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_pickup_evidence_list_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    response = await client.get(f"/api/v1/orders/{order_id}/pickup-evidence")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_pickup_evidence_upload_requires_auth(client: AsyncClient) -> None:
    order_id = uuid.uuid4()
    files = {"files": ("pickup.jpg", _make_jpeg_bytes(), "image/jpeg")}
    response = await client.post(f"/api/v1/partner/orders/{order_id}/pickup-evidence", files=files)
    assert response.status_code == 401
