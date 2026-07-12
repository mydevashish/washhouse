"""Password hashing + JWT helpers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError, TokenExpiredError
from app.core.server_session import get_server_instance_id, validate_token_server_session

_BCRYPT_ROUNDS = 12


def _password_bytes(plain: str) -> bytes:
    """Bcrypt accepts at most 72 bytes."""
    return plain.encode("utf-8")[:72]


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(_password_bytes(plain), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _signing_key() -> str:
    if settings.JWT_ALG == "RS256":
        if not settings.JWT_PRIVATE_KEY:
            raise RuntimeError("JWT_PRIVATE_KEY is required for RS256")
        return settings.JWT_PRIVATE_KEY
    return settings.JWT_SECRET


def _verify_key() -> str:
    if settings.JWT_ALG == "RS256":
        if not settings.JWT_PUBLIC_KEY:
            raise RuntimeError("JWT_PUBLIC_KEY is required for RS256")
        return settings.JWT_PUBLIC_KEY
    return settings.JWT_SECRET


def create_access_token(*, subject: str, role: str) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "iss": settings.JWT_ISSUER,
        "sub": subject,
        "role": role,
        "typ": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_TTL_MIN),
        "jti": str(uuid4()),
        "sid": get_server_instance_id(),
    }
    return jwt.encode(payload, _signing_key(), algorithm=settings.JWT_ALG)


def create_refresh_token(*, subject: str) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "iss": settings.JWT_ISSUER,
        "sub": subject,
        "typ": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS),
        "jti": str(uuid4()),
        "sid": get_server_instance_id(),
    }
    return jwt.encode(payload, _signing_key(), algorithm=settings.JWT_ALG)


def decode_token(token: str, *, validate_session: bool = True) -> dict[str, Any]:
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            _verify_key(),
            algorithms=[settings.JWT_ALG],
            issuer=settings.JWT_ISSUER,
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid token") from exc
    if validate_session:
        validate_token_server_session(payload)
    return payload
