# Backend Architecture

## Layering

```
HTTP (FastAPI)         ← app/api/v1/endpoints
   ↓ Pydantic (schemas)
Service                ← app/services
   ↓ Domain types
Repository             ← app/repositories
   ↓ ORM (SQLAlchemy)
Model (DB)             ← app/models
```

Background work:

```
HTTP / scheduler → app/tasks/celery_app.py → Worker
                                                ↓ Service / Repository
                                                ↓ DB / external APIs
```

## Rules

- **Endpoints are thin.** No business logic. They:
  1. Parse + validate input (Pydantic).
  2. Authenticate / authorize (via deps).
  3. Delegate to a service.
  4. Serialize response (Pydantic).
- **Services hold orchestration + business rules.** They:
  - Compose multiple repositories.
  - Raise domain exceptions (never HTTP exceptions).
  - Run inside transactions (`async with session.begin()`).
- **Repositories own persistence.** They:
  - Speak SQLAlchemy.
  - Never speak HTTP.
  - Return ORM entities or dataclasses, never Pydantic models.
- **Models own the schema.** No business logic. Mixins for timestamps + soft-delete.
- **Tasks** can call services, never endpoints. Idempotent. Bounded retries with backoff.

## Dependency direction

`endpoint → service → repository → model`

Never the reverse. Never skip a layer.

## Cross-cutting

| Concern        | Lives in                                          |
| -------------- | ------------------------------------------------- |
| Auth           | `app/core/security.py`, `app/api/v1/deps.py`      |
| Errors         | `app/core/exceptions.py`, `app/middleware/error_handler.py` |
| Logging        | `app/core/logging.py`, `app/middleware/request_id.py` |
| Config         | `app/core/config.py`                              |
| DB session     | `app/db/session.py`                               |
| Security hdrs  | `app/middleware/security_headers.py`              |
| Rate limit     | `app/middleware/rate_limit.py` (planned)          |

## Request lifecycle

1. Middleware: request_id, security headers, CORS.
2. Route → Pydantic validation.
3. Auth dep → `current_user`.
4. Authorization dep (role / object-level).
5. Service call.
6. Repository → DB.
7. Response Pydantic model → ORJSON.
8. Logs include `request_id`, `user_id`, `route`, `status`, `duration_ms`.

## Error mapping

- `NotFoundError`         → 404
- `ValidationError`       → 422
- `UnauthorizedError`     → 401
- `ForbiddenError`        → 403
- `ConflictError`         → 409
- `RateLimitedError`      → 429
- `DomainError`           → 500 (only the very base; specific subclasses preferred)

See `app/core/exceptions.py` for the full hierarchy and `rules/06-error-handling.md`.
