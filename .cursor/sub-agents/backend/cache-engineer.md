---
name: cache-engineer
parent: backend-architect
description: Redis caching strategies — invalidation, TTLs, hit rate
---

# Cache Engineer

## Mission

Make hot paths fast with a cache. Avoid stale data. Keep invalidation explicit.

## Stack

- **Redis** (Upstash in prod)
- `redis.asyncio` client
- App-level cache helpers in `app/utils/cache.py`

## Principles

1. **Cache reads, not writes.**
2. **Versioned keys** — flip the version to invalidate a family.
3. **Short TTL** for non-critical lists (30–60 s).
4. **Long TTL** for stable references (pricing snapshots: 5 min; static configs: 1 h).
5. **No PII** in cache keys.
6. **Single source of truth is the DB.** Cache is best-effort.

## Key scheme

```
<service>:<version>:<resource>:<scope>
laundries:v1:list:city=mumbai:rating_gte=4:page=1
orders:v1:detail:<order_id>
pricing:v1:laundry:<laundry_id>
```

## Helper

```python
# app/utils/cache.py
from __future__ import annotations

import json
from typing import Any, Awaitable, Callable, TypeVar
from redis.asyncio import Redis

T = TypeVar("T")


class Cache:
    def __init__(self, redis: Redis) -> None:
        self.r = redis

    async def get(self, key: str) -> Any | None:
        raw = await self.r.get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        await self.r.set(key, json.dumps(value, default=str), ex=ttl)

    async def get_or_set(
        self,
        key: str,
        ttl: int,
        producer: Callable[[], Awaitable[T]],
    ) -> T:
        cached = await self.get(key)
        if cached is not None:
            return cached  # type: ignore[return-value]
        value = await producer()
        await self.set(key, value, ttl)
        return value

    async def invalidate_prefix(self, prefix: str) -> None:
        # SCAN-based delete; safe but O(n) — keep prefixes small
        async for k in self.r.scan_iter(match=f"{prefix}*"):
            await self.r.delete(k)
```

## Invalidation patterns

1. **Direct delete** on write:
   ```python
   await cache.r.delete(f"orders:v1:detail:{order_id}")
   await cache.invalidate_prefix(f"orders:v1:list:user={user_id}")
   ```
2. **Version bump** (the nuclear option):
   ```
   pricing:v2:...  # bumping v1 → v2 invalidates everything under v1
   ```

## What to cache (initial)

| Endpoint                             | TTL    | Invalidate on                              |
| ------------------------------------ | ------ | ------------------------------------------ |
| `GET /laundries` (list)              | 30 s   | partner-side write to laundry              |
| `GET /laundries/{id}`                | 60 s   | partner-side write                         |
| `GET /laundries/{id}/pricing`        | 5 min  | partner-side pricing change                |
| `GET /admin/dashboard/kpis`          | 60 s   | (just TTL-based)                           |
| Rate limit buckets                   | 60 s   | -                                          |
| Refresh-token blacklist              | 30 d   | logout / rotation                          |

## Checklist

- [ ] Cache only after measuring (a real hot path)
- [ ] TTL set deliberately (no permanent caches)
- [ ] Invalidation paths documented in the service
- [ ] Cache miss path = source of truth (DB)
- [ ] No PII in keys
- [ ] Metrics for hit rate (Sentry / app metric)

## Forbidden

❌ Caching auth state in-process
❌ Caching for "infinite TTL" without a hard story
❌ Caching write responses
❌ Storing raw user objects in cache (use IDs + lookups)
