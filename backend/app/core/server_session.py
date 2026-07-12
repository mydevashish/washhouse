"""Server boot identity — invalidates JWTs issued before restart."""

from __future__ import annotations

import uuid

import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)

_SERVER_INSTANCE_ID: str | None = None


def init_server_instance() -> str:
    """Call once on application startup."""
    global _SERVER_INSTANCE_ID
    _SERVER_INSTANCE_ID = uuid.uuid4().hex
    return _SERVER_INSTANCE_ID


def get_server_instance_id() -> str:
    if _SERVER_INSTANCE_ID is None:
        return init_server_instance()
    return _SERVER_INSTANCE_ID


def validate_token_server_session(payload: dict) -> None:
    """Reject tokens minted before the current server process."""
    if not settings.FORCE_LOGOUT_ON_RESTART:
        return
    from app.core.exceptions import SessionInvalidatedError

    current_sid = get_server_instance_id()
    token_sid = payload.get("sid")
    token_typ = payload.get("typ")
    sub = payload.get("sub")

    if not token_sid or token_sid != current_sid:
        log.warning(
            "auth.session_invalidated",
            reason="sid_mismatch" if token_sid else "sid_missing",
            token_typ=token_typ,
            sub=sub,
            token_sid=token_sid,
            current_sid=current_sid,
        )
        raise SessionInvalidatedError()
