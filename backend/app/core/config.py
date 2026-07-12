"""Application configuration via pydantic-settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_ASYNC_DATABASE_URL = (
    "postgresql+asyncpg://dlm:dlm_dev_password@localhost:5432/dlm_db"
)
_DEFAULT_DIRECT_DATABASE_URL = (
    "postgresql://dlm:dlm_dev_password@localhost:5432/dlm_db"
)


def normalize_async_database_url(url: str) -> str:
    """Accept Neon/Railway-style URLs and coerce them for SQLAlchemy async."""
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgresql://")
    elif url.startswith("postgresql+psycopg2://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgresql+psycopg2://")

    # asyncpg expects `ssl=` query params, not libpq `sslmode=`
    url = url.replace("sslmode=require", "ssl=require")
    url = url.replace("sslmode=verify-full", "ssl=require")
    url = url.replace("sslmode=verify-ca", "ssl=require")
    return url


def to_sync_database_url(url: str) -> str:
    """Strip async driver suffix for psycopg2 / Alembic offline migrations."""
    for prefix in ("postgresql+asyncpg://", "postgresql+psycopg2://"):
        if url.startswith(prefix):
            url = "postgresql://" + url.removeprefix(prefix)
            break
    url = url.replace("ssl=require", "sslmode=require")
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_ENV: str = "local"
    APP_NAME: str = "dlm-backend"
    APP_VERSION: str = "0.1.0"
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database (defaults match docker-compose.yml local Postgres)
    DATABASE_URL: str = _DEFAULT_ASYNC_DATABASE_URL
    DATABASE_URL_DIRECT: str = _DEFAULT_DIRECT_DATABASE_URL

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Auth / JWT
    JWT_ALG: str = "HS256"
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ISSUER: str = "dlm"
    JWT_PRIVATE_KEY: str | None = None
    JWT_PUBLIC_KEY: str | None = None
    ACCESS_TOKEN_TTL_MIN: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 30

    # Session invalidation on API restart (JWT `sid` claim vs in-memory boot id)
    FORCE_LOGOUT_ON_RESTART: bool = True

    # CORS
    CORS_ALLOW_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ALLOW_ORIGINS.split(",") if o.strip()]

    # Database migrations — run `alembic upgrade head` on app startup when true
    AUTO_RUN_MIGRATIONS: bool = True

    # Default admin (created on startup when AUTO_SEED_ADMIN=true and email absent)
    AUTO_SEED_ADMIN: bool = True
    SEED_ADMIN_EMAIL: str = "admin@yopmail.com"
    SEED_ADMIN_PASSWORD: str = "Admin@1234"
    SEED_ADMIN_FULL_NAME: str = "DLM Admin"

    # Demo laundries + sample customer (local dev only; disable in production)
    AUTO_SEED_DEMO: bool = True

    # Partner storefront image uploads (served from /api/v1/media)
    STOREFRONT_UPLOAD_DIR: str = "uploads"
    PICKUP_EVIDENCE_UPLOAD_DIR: str = "uploads/pickup-evidence"
    DELIVERY_PROOF_UPLOAD_DIR: str = "uploads/delivery-proof"
    DISPUTE_UPLOAD_DIR: str = "uploads/dispute-photos"

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True

    # Response cache (Redis)
    CACHE_ENABLED: bool = True
    CACHE_LAUNDRIES_LIST_TTL_SEC: int = 60
    CACHE_LAUNDRIES_SEARCH_TTL_SEC: int = 30

    # Observability
    SENTRY_DSN: str | None = None

    # Email
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str = "noreply@dlm.app"

    # SMS
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None
    TWILIO_WHATSAPP_FROM: str | None = None
    # Walk-in order WhatsApp Content SIDs (prod); omit for sandbox plain-text body
    TWILIO_WA_TEMPLATE_ORDER_RECEIVED: str | None = None
    TWILIO_WA_TEMPLATE_ORDER_IN_PROGRESS: str | None = None
    TWILIO_WA_TEMPLATE_ORDER_READY: str | None = None
    TWILIO_WA_TEMPLATE_ORDER_DELIVERED: str | None = None

    # OTP (dev: return code in API response)
    OTP_DEBUG: bool = True

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = None

    # Payments — Razorpay (India)
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None

    # Feature flags
    FEATURE_ONLINE_BOOKING: bool = True
    FEATURE_SUBSCRIPTIONS: bool = False
    FEATURE_SURGE_PRICING: bool = False
    ORDER_WS_ENABLED: bool = True

    @property
    def is_prod(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_local(self) -> bool:
        return self.APP_ENV == "local"

    @property
    def storefront_upload_path(self) -> Path:
        backend_root = Path(__file__).resolve().parents[2]
        return backend_root / self.STOREFRONT_UPLOAD_DIR / "storefront"

    @property
    def pickup_evidence_upload_path(self) -> Path:
        backend_root = Path(__file__).resolve().parents[2]
        return backend_root / self.PICKUP_EVIDENCE_UPLOAD_DIR

    @property
    def delivery_proof_upload_path(self) -> Path:
        backend_root = Path(__file__).resolve().parents[2]
        return backend_root / self.DELIVERY_PROOF_UPLOAD_DIR

    @property
    def dispute_upload_path(self) -> Path:
        backend_root = Path(__file__).resolve().parents[2]
        return backend_root / self.DISPUTE_UPLOAD_DIR

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: object) -> object:
        if isinstance(value, str):
            return normalize_async_database_url(value)
        return value

    @field_validator("DATABASE_URL_DIRECT", mode="before")
    @classmethod
    def _normalize_direct_database_url(cls, value: object) -> object:
        if isinstance(value, str) and value.startswith(
            ("postgresql+asyncpg://", "postgresql+psycopg2://", "postgres://")
        ):
            return to_sync_database_url(normalize_async_database_url(value))
        return value

    @model_validator(mode="after")
    def _derive_direct_database_url(self) -> Settings:
        if (
            self.DATABASE_URL != _DEFAULT_ASYNC_DATABASE_URL
            and self.DATABASE_URL_DIRECT == _DEFAULT_DIRECT_DATABASE_URL
        ):
            self.DATABASE_URL_DIRECT = to_sync_database_url(self.DATABASE_URL)
        return self

    @field_validator("SMTP_PORT", mode="before")
    @classmethod
    def _empty_optional_int(cls, value: object) -> object:
        if value == "" or value is None:
            return None
        return value

    @field_validator(
        "SMTP_HOST",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SENTRY_DSN",
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER",
        "TWILIO_WHATSAPP_FROM",
        "TWILIO_WA_TEMPLATE_ORDER_RECEIVED",
        "TWILIO_WA_TEMPLATE_ORDER_IN_PROGRESS",
        "TWILIO_WA_TEMPLATE_ORDER_READY",
        "TWILIO_WA_TEMPLATE_ORDER_DELIVERED",
        "GOOGLE_CLIENT_ID",
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
        "RAZORPAY_WEBHOOK_SECRET",
        mode="before",
    )
    @classmethod
    def _empty_optional_str(cls, value: object) -> object:
        if value == "":
            return None
        return value


def alembic_sqlalchemy_url_option(url: str | None = None) -> str:
    """Escape DATABASE_URL for Alembic ini ConfigParser (``%`` in URL-encoded passwords)."""
    raw = url if url is not None else get_settings().DATABASE_URL_DIRECT
    return raw.replace("%", "%%")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
