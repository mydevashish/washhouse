"""FastAPI application factory and entry point."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.migrate import run_pending_migrations
from app.db.seed_admin import ensure_default_admin
from app.db.seed_demo import ensure_demo_data
from app.db.seed_storefront import backfill_storefront_contacts_from_owners, ensure_demo_storefronts
from app.core.server_session import init_server_instance
from app.middleware.error_handler import register_error_handlers
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.core.redis_client import close_redis
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.server_session import ServerSessionMiddleware

configure_logging()
log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    boot_id = init_server_instance()
    log.info("server_instance.ready", server_instance_id=boot_id)
    if settings.AUTO_RUN_MIGRATIONS:
        await asyncio.to_thread(run_pending_migrations)
    if settings.AUTO_SEED_ADMIN:
        await ensure_default_admin()
    if settings.AUTO_SEED_DEMO:
        await ensure_demo_data()
        await ensure_demo_storefronts()
        await backfill_storefront_contacts_from_owners()
    log.info("app.startup", env=settings.APP_ENV, version=settings.APP_VERSION)
    yield
    await close_redis()
    log.info("app.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Doorstep Laundry Marketplace API",
        description="Customers · Partners · Admin",
        version=settings.APP_VERSION,
        default_response_class=ORJSONResponse,
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Server-Instance-Id"],
    )

    # Custom middleware
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(ServerSessionMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # Error handlers
    register_error_handlers(app)

    # Routers
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
