"""Public laundry list must not cache empty payloads (stale empty discovery)."""

from __future__ import annotations

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.schemas.laundry import LaundryListItem
from app.services.laundry_service import LaundryService


def _fake_laundry(*, name: str = "Demo Wash") -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        name=name,
        slug="demo-wash",
        city="Bengaluru",
        avg_rating=Decimal("4.50"),
        review_count=10,
        is_verified=True,
        latitude=None,
        longitude=None,
    )


@pytest.mark.asyncio
async def test_list_public_does_not_cache_empty_results() -> None:
    session = MagicMock()
    svc = LaundryService(session)
    svc._laundries.list_approved = AsyncMock(return_value=[])
    svc._laundries.count_approved = AsyncMock(return_value=0)
    svc._hints_map = AsyncMock(return_value={})

    with (
        patch("app.services.laundry_service.cache_get_json", new_callable=AsyncMock) as cache_get,
        patch("app.services.laundry_service.cache_set_json", new_callable=AsyncMock) as cache_set,
    ):
        cache_get.return_value = None
        items, total = await svc.list_public(limit=100, offset=0)

    assert items == []
    assert total == 0
    cache_set.assert_not_awaited()


@pytest.mark.asyncio
async def test_list_public_caches_non_empty_results_with_total() -> None:
    session = MagicMock()
    svc = LaundryService(session)
    row = _fake_laundry()
    svc._laundries.list_approved = AsyncMock(return_value=[row])
    svc._laundries.count_approved = AsyncMock(return_value=1)
    svc._hints_map = AsyncMock(return_value={})

    with (
        patch("app.services.laundry_service.cache_get_json", new_callable=AsyncMock) as cache_get,
        patch("app.services.laundry_service.cache_set_json", new_callable=AsyncMock) as cache_set,
        patch("app.services.laundry_service.settings") as settings,
    ):
        cache_get.return_value = None
        settings.CACHE_LAUNDRIES_LIST_TTL_SEC = 60
        items, total = await svc.list_public(limit=100, offset=0)

    assert len(items) == 1
    assert total == 1
    assert isinstance(items[0], LaundryListItem)
    cache_set.assert_awaited_once()
    cached_payload = cache_set.await_args.args[1]
    assert isinstance(cached_payload, dict)
    assert cached_payload["total"] == 1
    assert len(cached_payload["items"]) == 1


@pytest.mark.asyncio
async def test_list_public_reads_v4_cache_shape() -> None:
    session = MagicMock()
    svc = LaundryService(session)
    laundry_id = uuid4()
    cached = {
        "total": 3,
        "items": [
            {
                "id": str(laundry_id),
                "name": "Cached Wash",
                "slug": "cached-wash",
                "city": "Bengaluru",
                "avg_rating": "4.00",
                "review_count": 1,
                "is_verified": True,
            },
        ],
    }

    with patch("app.services.laundry_service.cache_get_json", new_callable=AsyncMock) as cache_get:
        cache_get.return_value = cached
        items, total = await svc.list_public(limit=100, offset=0)

    assert total == 3
    assert len(items) == 1
    assert items[0].name == "Cached Wash"
