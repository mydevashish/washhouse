"""Server boot session (`sid`) validation."""

from __future__ import annotations

import jwt

from app.core.config import settings
from app.core.exceptions import SessionInvalidatedError
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.server_session import get_server_instance_id, init_server_instance, validate_token_server_session


def test_access_token_includes_sid_and_passes_validation() -> None:
    init_server_instance()
    sid = get_server_instance_id()
    token = create_access_token(subject="00000000-0000-0000-0000-000000000001", role="customer")
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG], issuer=settings.JWT_ISSUER)
    assert payload["sid"] == sid
    validate_token_server_session(payload)


def test_access_token_without_sid_rejected_when_force_logout_enabled() -> None:
    init_server_instance()
    payload = {
        "typ": "access",
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "customer",
    }
    try:
        validate_token_server_session(payload)
        assert not settings.FORCE_LOGOUT_ON_RESTART
    except SessionInvalidatedError:
        assert settings.FORCE_LOGOUT_ON_RESTART


def test_refresh_token_sid_matches_boot_id() -> None:
    init_server_instance()
    sid = get_server_instance_id()
    token = create_refresh_token(subject="00000000-0000-0000-0000-000000000001")
    payload = decode_token(token, validate_session=True)
    assert payload["sid"] == sid
