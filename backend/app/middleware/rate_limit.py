"""Redis-backed sliding-window rate limiting."""

from __future__ import annotations

import asyncio
import time
from collections.abc import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.exceptions import RateLimitError

log = structlog.get_logger(__name__)

# path prefix -> (max_requests, window_seconds)
LIMITS: dict[str, tuple[int, int]] = {
    "/api/v1/auth": (20, 60),
    "/api/v1/auth/otp": (5, 60),
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        path = request.url.path
        limit_rule = None
        for prefix, rule in LIMITS.items():
            if path.startswith(prefix):
                limit_rule = rule
                break

        if limit_rule is None:
            return await call_next(request)

        max_req, window = limit_rule
        client = request.client.host if request.client else "unknown"
        key = f"rl:{path}:{client}"

        try:
            from app.core.redis_client import get_redis

            r = get_redis()
            now = int(time.time())
            pipe = r.pipeline()
            pipe.zremrangebyscore(key, 0, now - window)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window)
            _, _, count, _ = await asyncio.wait_for(pipe.execute(), timeout=2.0)

            if count > max_req:
                raise RateLimitError()
        except RateLimitError:
            raise
        except Exception as exc:
            log.warning("rate_limit.redis_unavailable", error=str(exc))

        return await call_next(request)
