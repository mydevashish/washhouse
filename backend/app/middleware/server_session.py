"""Expose current server boot id on every HTTP response."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.server_session import get_server_instance_id

HEADER = "X-Server-Instance-Id"


class ServerSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers[HEADER] = get_server_instance_id()
        return response
