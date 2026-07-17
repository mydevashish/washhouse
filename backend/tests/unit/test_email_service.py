"""Unit tests for EmailService (SMTP missing + mocked send)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import Settings
from app.core.exceptions import EmailDeliveryError, EmailNotConfiguredError
from app.services.email_service import EmailService


def _smtp_settings(**overrides: object) -> Settings:
    base = {
        "APP_ENV": "local",
        "JWT_SECRET": "dev-secret-change-me",
        "SMTP_HOST": None,
        "SMTP_PORT": None,
        "SMTP_USERNAME": None,
        "SMTP_PASSWORD": None,
        "SMTP_FROM_EMAIL": "noreply@dlm.app",
        "SMTP_USE_TLS": None,
        "SMTP_USE_SSL": None,
        "SUPPORT_EMAIL": None,
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_send_raises_when_smtp_missing() -> None:
    service = EmailService(_smtp_settings())
    with pytest.raises(EmailNotConfiguredError) as exc_info:
        await service.send(to="user@example.com", subject="Hi", text="Hello")
    assert exc_info.value.code == "EMAIL_NOT_CONFIGURED"
    assert exc_info.value.status_code == 503


@pytest.mark.asyncio
async def test_send_succeeds_when_mocked() -> None:
    cfg = _smtp_settings(
        SMTP_HOST="smtp.example.com",
        SMTP_PORT=587,
        SMTP_USERNAME="user",
        SMTP_PASSWORD="secret",
        SMTP_FROM_EMAIL="noreply@dlm.app",
        SMTP_USE_TLS=True,
        SMTP_USE_SSL=False,
    )
    service = EmailService(cfg)

    with patch("app.services.email_service.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await service.send(
            to="user@example.com",
            subject="Reset code",
            text="Your code is 123456",
            reply_to="support@dlm.app",
        )

    mock_send.assert_awaited_once()
    call_kwargs = mock_send.await_args.kwargs
    assert call_kwargs["hostname"] == "smtp.example.com"
    assert call_kwargs["port"] == 587
    assert call_kwargs["username"] == "user"
    assert call_kwargs["password"] == "secret"
    assert call_kwargs["use_tls"] is False
    assert call_kwargs["start_tls"] is True
    message = mock_send.await_args.args[0]
    assert message["To"] == "user@example.com"
    assert message["From"] == "noreply@dlm.app"
    assert message["Subject"] == "Reset code"


@pytest.mark.asyncio
async def test_send_uses_ssl_on_port_465() -> None:
    cfg = _smtp_settings(
        SMTP_HOST="smtp.example.com",
        SMTP_PORT=465,
        SMTP_USERNAME="user",
        SMTP_PASSWORD="secret",
        SMTP_FROM_EMAIL="noreply@dlm.app",
    )
    service = EmailService(cfg)

    with patch("app.services.email_service.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await service.send(to="a@b.com", subject="t", text="body")

    assert mock_send.await_args.kwargs["use_tls"] is True
    assert mock_send.await_args.kwargs["start_tls"] is False


@pytest.mark.asyncio
async def test_send_maps_smtp_failure_to_delivery_error() -> None:
    cfg = _smtp_settings(
        SMTP_HOST="smtp.example.com",
        SMTP_PORT=587,
        SMTP_FROM_EMAIL="noreply@dlm.app",
    )
    service = EmailService(cfg)

    with patch(
        "app.services.email_service.aiosmtplib.send",
        new_callable=AsyncMock,
        side_effect=OSError("connection refused"),
    ):
        with pytest.raises(EmailDeliveryError) as exc_info:
            await service.send(to="a@b.com", subject="t", text="body")
    assert exc_info.value.code == "EMAIL_DELIVERY_FAILED"
    assert exc_info.value.status_code == 502


def test_settings_rejects_host_without_port(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.delenv("SMTP_PORT", raising=False)
    with pytest.raises(ValueError, match="SMTP_PORT is required"):
        Settings(_env_file=None)


def test_settings_empty_smtp_port_becomes_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("SMTP_PORT", "")
    cfg = Settings(_env_file=None)
    assert cfg.SMTP_HOST is None
    assert cfg.SMTP_PORT is None
    assert cfg.smtp_is_configured is False


def test_settings_port_465_defaults_to_ssl(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "465")
    monkeypatch.setenv("SMTP_FROM_EMAIL", "noreply@dlm.app")
    cfg = Settings(_env_file=None)
    assert cfg.smtp_use_ssl is True
    assert cfg.smtp_use_tls is False


def test_settings_rejects_username_without_password(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "user")
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    with pytest.raises(ValueError, match="SMTP_PASSWORD is required"):
        Settings(_env_file=None)
