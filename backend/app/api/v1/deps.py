"""FastAPI dependency providers.

These are the building blocks for endpoint signatures:
    current_user = Depends(get_current_user)
    service = Depends(get_order_service)
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_token
from app.db.session import get_session

# ---------- Session ----------
SessionDep = Annotated[AsyncSession, Depends(get_session)]


# ---------- Auth ----------
async def get_current_user_payload(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token, validate_session=True)
    if payload.get("typ") != "access":
        raise AuthenticationError("Wrong token type")
    return payload


async def get_optional_user_payload(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_token(token, validate_session=True)
        if payload.get("typ") != "access":
            return None
        return payload
    except Exception:
        return None


def require_role(*roles: str) -> Callable[..., Awaitable[dict]]:
    async def _checker(
        payload: Annotated[dict, Depends(get_current_user_payload)],
    ) -> dict:
        if payload.get("role") not in roles:
            raise AuthorizationError()
        return payload

    return _checker


# Convenience role-specific dependencies
get_current_customer = require_role("customer")
get_current_partner = require_role("partner")
get_current_admin = require_role("admin", "super_admin")
get_current_platform_partner = require_role("platform_partner", "admin", "super_admin")
