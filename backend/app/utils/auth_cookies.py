"""HttpOnly refresh-token cookie helpers."""

from __future__ import annotations

from fastapi import Response

from app.core.config import settings

REFRESH_COOKIE = "dlm_refresh"
REFRESH_MAX_AGE = settings.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.is_prod,
        samesite="lax",
        max_age=REFRESH_MAX_AGE,
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/v1/auth")
