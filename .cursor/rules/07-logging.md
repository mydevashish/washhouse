---
description: Structured logging standards
globs: backend/**
alwaysApply: false
---

# Logging Rules

## Principles

1. **Structured JSON logs** in production. Human-readable in dev.
2. **No PII in logs.** Mask emails, phone numbers, names, addresses.
3. **Correlate via `request_id`.** Generated at the edge, passed downstream.
4. **Log at boundaries** — incoming request, outgoing call, async task start/end.
5. **No `print()` / no `console.log`** in committed code.

## Backend

### Configuration (`app/core/logging.py`)

- Use the standard library `logging` configured with `structlog` for structured output.
- Levels: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.
- Each log line includes: `timestamp`, `level`, `request_id`, `route`, `user_id`, `event`.

### Example

```python
import structlog

logger = structlog.get_logger(__name__)

async def create_order(...):
    logger.info(
        "order.create.start",
        user_id=str(user.id),
        laundry_id=str(payload.laundry_id),
    )
    try:
        order = await repo.create(...)
    except Exception:
        logger.exception("order.create.failed", user_id=str(user.id))
        raise
    logger.info("order.create.ok", order_id=str(order.id))
    return order
```

### Level usage

| Level    | When                                                           |
| -------- | -------------------------------------------------------------- |
| DEBUG    | Verbose dev info. Off in prod.                                 |
| INFO     | Business events: order created, login success, payment ok.     |
| WARNING  | Recoverable issues: rate limited, retry, 4xx client errors.    |
| ERROR    | Failed operations needing investigation. Includes traceback.   |
| CRITICAL | Service-down conditions: DB unreachable, queue dead.           |

### Event naming

`<domain>.<action>.<outcome>` — `order.create.ok`, `auth.login.failed`, `payment.webhook.received`.

### Forbidden in logs

❌ Passwords, OTPs, tokens, API keys
❌ Full request bodies for sensitive endpoints
❌ Credit card numbers (or any PAN)
❌ Raw user names, emails (mask to `j***@example.com`)
❌ Phone numbers (mask to `+91 9***** *234`)

## Frontend

### Logger (`lib/logger.ts`)

A thin wrapper over `console` in dev and Sentry breadcrumbs in prod.

```ts
export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => ...,
  info: (msg: string, ctx?: Record<string, unknown>) => ...,
  warn: (msg: string, ctx?: Record<string, unknown>) => ...,
  error: (msg: string, ctx?: Record<string, unknown>) => ...,
};
```

### Rules

- No raw `console.log` in committed code. ESLint enforces.
- Every error caught at the boundary is forwarded to Sentry with breadcrumbs.
- Tag events with `feature`, `route`, `user_id` (if logged in).

## Request ID propagation

1. **Edge / gateway** generates `X-Request-ID` if absent.
2. **Backend middleware** (`app/middleware/request_id.py`) reads or generates, binds to `structlog.contextvars`.
3. **All logs** include `request_id`.
4. **Frontend** echoes `X-Request-ID` from response headers into Sentry events.

## Audit logs

Sensitive operations (admin actions, payments, role changes) write to a dedicated `audit_logs` table — see `docs/security/audit.md`.

| Operation                          | Audit fields                                                  |
| ---------------------------------- | ------------------------------------------------------------- |
| Admin approves laundry             | `actor_id`, `laundry_id`, `before`, `after`, `reason`         |
| Admin changes commission           | `actor_id`, `laundry_id`, `old_rate`, `new_rate`              |
| Payment refund                     | `actor_id`, `order_id`, `amount`, `reason`                    |
| Role / permission change           | `actor_id`, `target_user_id`, `old_role`, `new_role`          |

## Retention

| Log type      | Retention | Storage                   |
| ------------- | --------- | ------------------------- |
| App logs      | 30 days   | Railway / log drain       |
| Audit logs    | 7 years   | Postgres (`audit_logs`)   |
| Access logs   | 90 days   | Vercel / Railway          |
| Sentry events | 90 days   | Sentry                    |

## Local development

- Pretty console output (colored).
- `LOG_LEVEL=DEBUG` in `.env`.
- Each request emits a one-line summary: `INFO 200 POST /api/v1/orders 42ms req=req_...`
