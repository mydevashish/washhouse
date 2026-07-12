# Backend Architecture

## Layering

```
┌────────────────────────────────────────────────────────┐
│ API (FastAPI router)                                   │
│  - Pydantic schemas                                    │
│  - Depends(auth, role, services)                       │
│  - No DB calls. No business logic.                     │
└────────────────────────────────────────────────────────┘
                       │ calls
                       ▼
┌────────────────────────────────────────────────────────┐
│ Service                                                │
│  - Business rules + orchestration                      │
│  - Transactions across repositories                    │
│  - Raises domain exceptions                            │
│  - No FastAPI primitives                               │
└────────────────────────────────────────────────────────┘
                       │ calls
                       ▼
┌────────────────────────────────────────────────────────┐
│ Repository                                             │
│  - SQLAlchemy queries                                  │
│  - Returns models or DTOs                              │
│  - No business logic                                   │
└────────────────────────────────────────────────────────┘
                       │ uses
                       ▼
┌────────────────────────────────────────────────────────┐
│ Model (SQLAlchemy ORM)                                 │
│  - Pure data + relationships                           │
└────────────────────────────────────────────────────────┘
```

## Module map

| Module                          | Owns                                           |
| ------------------------------- | ---------------------------------------------- |
| `app/api/v1/endpoints/*.py`     | HTTP routers per resource                      |
| `app/api/v1/deps.py`            | Auth, role, service DI                         |
| `app/core/config.py`            | All settings via `pydantic-settings`           |
| `app/core/security.py`          | Password hashing, JWT issue/decode             |
| `app/core/exceptions.py`        | Domain exception hierarchy                     |
| `app/core/logging.py`           | structlog configuration                        |
| `app/db/base.py`                | Declarative base + mixins                      |
| `app/db/session.py`             | Async engine + session factory                 |
| `app/middleware/*.py`           | Request ID, security headers, error handler   |
| `app/models/*.py`               | One file per aggregate                         |
| `app/repositories/*.py`         | One repository per aggregate                   |
| `app/schemas/*.py`              | Pydantic in/out schemas per resource           |
| `app/services/*.py`             | One service per aggregate / use-case           |
| `app/tasks/*.py`                | Celery tasks grouped by domain                 |
| `app/utils/*.py`                | Pure helpers                                   |
| `app/main.py`                   | App factory + middleware + routers             |

## Request lifecycle

1. **Request arrives** → uvicorn → ASGI
2. **CORS middleware** sets CORS headers
3. **Request ID middleware** binds `request_id` to logs
4. **Security headers middleware** sets headers on response
5. **Router** matches route → `Depends` resolve
6. **Pydantic** validates body + query
7. **Auth dependency** decodes JWT → `current_user`
8. **Role dependency** verifies role
9. **Service** runs business logic; raises domain errors on failure
10. **Repository** does DB I/O
11. **Service** commits transaction (via FastAPI session generator)
12. **Endpoint** wraps the result in a Pydantic response model
13. **Error handler** (if needed) maps `DomainError` → JSON envelope + status
14. **Response** sent with security headers + request ID

## Domain error → HTTP mapping

| Domain                     | HTTP |
| -------------------------- | ---- |
| `NotFoundError`            | 404  |
| `ValidationError`          | 422  |
| `AuthenticationError`      | 401  |
| `AuthorizationError`       | 403  |
| `ConflictError`            | 409  |
| `RateLimitError`           | 429  |

## Background work

- Decision: > 200 ms or external I/O → Celery
- Tasks are **idempotent**, accept **IDs**, structured logs at start/ok/retry/failed
- Beat schedules in `app/tasks/celery_app.py`

## Async + DB

- `AsyncSession` per request (FastAPI dependency)
- Commit at end of dependency context
- Use `selectinload` / `joinedload` to kill N+1
- `lazy="raise"` on relationships to catch accidental lazy loads

## Configuration

- Single `Settings` class in `app/core/config.py`
- Validated at import
- No `os.environ.get(...)` anywhere else

## Observability

- `structlog` JSON logs in prod
- Sentry attached automatically (FastAPI integration)
- Health endpoint at `/api/v1/health`

## Related

- `.cursor/agents/backend-architect.md`
- `.cursor/rules/01-architecture.md`
- `.cursor/rules/05-api-standards.md`
- `.cursor/rules/06-error-handling.md`
