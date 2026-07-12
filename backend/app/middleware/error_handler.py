"""Global error handlers — maps domain exceptions + unhandled errors to JSON."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import structlog
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse

from app.core.exceptions import DomainError

log = structlog.get_logger(__name__)


def _envelope(
    *,
    code: str,
    message: str,
    details: list[Any] | None = None,
    request: Request,
) -> dict[str, Any]:
    request_id = request.headers.get("X-Request-ID") or ""
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
        "meta": {
            "request_id": request_id,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain_handler(request: Request, exc: DomainError) -> ORJSONResponse:
        path = request.url.path
        is_stale_refresh = path.endswith("/auth/refresh") and exc.code in {
            "AUTH_INVALID_CREDENTIALS",
            "AUTH_TOKEN_EXPIRED",
            "AUTH_TOKEN_REUSE",
            "AUTH_SESSION_INVALIDATED",
        }
        log_fn = log.debug if is_stale_refresh else log.warning
        log_fn(
            "request.domain_error",
            code=exc.code,
            status=exc.status_code,
            route=path,
        )
        return ORJSONResponse(
            status_code=exc.status_code,
            content=_envelope(
                code=exc.code,
                message=exc.message,
                details=[d.__dict__ for d in exc.details] if exc.details else [],
                request=request,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError) -> ORJSONResponse:
        details = [
            {"field": ".".join(str(p) for p in err.get("loc", [])), "issue": err.get("msg", "")}
            for err in exc.errors()
        ]
        return ORJSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope(
                code="VALIDATION_FAILED",
                message="Validation failed",
                details=details,
                request=request,
            ),
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> ORJSONResponse:
        log.exception(
            "request.unhandled",
            route=request.url.path,
            method=request.method,
        )
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred",
                request=request,
            ),
        )

    # encoder hook for jsonable_encoder usage anywhere in the app
    _ = jsonable_encoder
