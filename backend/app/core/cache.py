"""JSON cache helpers backed by Redis."""

from __future__ import annotations

import json
from typing import Any

import structlog

from app.core.config import settings
from app.core.redis_client import get_redis

log = structlog.get_logger(__name__)


async def cache_get_json(key: str) -> Any | None:
    if not settings.CACHE_ENABLED:
        return None
    try:
        raw = await get_redis().get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        log.warning("cache.get_failed", key=key, error=str(exc))
        return None


async def cache_set_json(key: str, value: Any, *, ttl_seconds: int) -> None:
    if not settings.CACHE_ENABLED:
        return
    try:
        await get_redis().set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception as exc:
        log.warning("cache.set_failed", key=key, error=str(exc))


async def cache_delete_pattern(prefix: str) -> None:
    if not settings.CACHE_ENABLED:
        return
    try:
        redis = get_redis()
        async for key in redis.scan_iter(match=f"{prefix}*"):
            await redis.delete(key)
    except Exception as exc:
        log.warning("cache.delete_pattern_failed", prefix=prefix, error=str(exc))
