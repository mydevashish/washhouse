"""Extract client metadata from requests."""

from __future__ import annotations

from fastapi import Request


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def user_agent(request: Request) -> str | None:
    return request.headers.get("User-Agent")
