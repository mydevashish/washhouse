"""Database URL normalization for hosted Postgres providers."""

from __future__ import annotations

import os

import pytest

from app.core.config import Settings, normalize_async_database_url, to_sync_database_url


def test_normalize_neon_style_url() -> None:
    raw = (
        "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require"
    )
    assert normalize_async_database_url(raw) == (
        "postgresql+asyncpg://user:pass@ep-example.neon.tech/neondb?ssl=require"
    )


def test_to_sync_database_url() -> None:
    async_url = (
        "postgresql+asyncpg://user:pass@ep-example.neon.tech/neondb?ssl=require"
    )
    assert to_sync_database_url(async_url) == (
        "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require"
    )


def test_settings_derives_direct_url_from_neon_paste(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    neon_url = (
        "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require"
    )
    monkeypatch.setenv("DATABASE_URL", neon_url)
    monkeypatch.delenv("DATABASE_URL_DIRECT", raising=False)

    settings = Settings(_env_file=None)

    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")
    assert "ssl=require" in settings.DATABASE_URL
    assert settings.DATABASE_URL_DIRECT.startswith("postgresql://")
    assert "sslmode=require" in settings.DATABASE_URL_DIRECT


def test_settings_respects_explicit_direct_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async_url = "postgresql+asyncpg://user:pass@pooler/neondb?ssl=require"
    direct_url = "postgresql://user:pass@direct/neondb?sslmode=require"
    monkeypatch.setenv("DATABASE_URL", async_url)
    monkeypatch.setenv("DATABASE_URL_DIRECT", direct_url)

    settings = Settings(_env_file=None)

    assert settings.DATABASE_URL == async_url
    assert settings.DATABASE_URL_DIRECT == direct_url


def test_production_rejects_weak_jwt_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "dev-secret-change-me")

    with pytest.raises(ValueError, match="JWT_SECRET must be at least 32 characters"):
        Settings(_env_file=None)


def test_production_accepts_strong_jwt_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "x" * 32)
    monkeypatch.setenv("OTP_DEBUG", "true")
    monkeypatch.setenv("AUTO_SEED_DEMO", "true")

    settings = Settings(_env_file=None)

    assert settings.OTP_DEBUG is False
    assert settings.AUTO_SEED_DEMO is False
