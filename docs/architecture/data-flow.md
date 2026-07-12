# Data Flow

End-to-end how a write request moves through the system.

## Example: Customer places an order

```mermaid
sequenceDiagram
  autonumber
  participant U as Customer (Browser)
  participant Next as Next.js
  participant Axios as Axios (lib/api.ts)
  participant Edge as Vercel Edge
  participant FastAPI as FastAPI (Railway)
  participant Svc as OrderService
  participant Repo as OrderRepo
  participant PG as Postgres (Neon)
  participant Redis as Redis (Upstash)
  participant Worker as Celery Worker
  participant SMS as Twilio

  U->>Next: tap "Schedule pickup"
  Next->>Axios: useCreateOrder mutation
  Axios->>Edge: POST /api/v1/orders + Bearer JWT
  Edge->>FastAPI: forward
  FastAPI->>FastAPI: middleware (request id, security headers)
  FastAPI->>FastAPI: validate (Pydantic)
  FastAPI->>FastAPI: Depends(get_current_customer)
  FastAPI->>Svc: OrderService.create(user, payload)
  Svc->>Svc: business rules (laundry approved? schedule valid?)
  Svc->>Repo: insert order
  Repo->>PG: SQL insert
  PG-->>Repo: row
  Svc->>Redis: queue notifications.send_pickup_confirmation
  Svc-->>FastAPI: Order
  FastAPI-->>Axios: 201 + OrderResponse
  Axios-->>Next: data
  Next->>Next: TanStack Query cache invalidate
  Next-->>U: navigate to /orders/<id>

  Redis-->>Worker: pickup_confirmation task
  Worker->>SMS: send SMS
  SMS-->>Worker: ok
  Worker->>Worker: logs success
```

## Read path

Reads use TanStack Query:

```mermaid
sequenceDiagram
  participant U as Customer
  participant Next as Next.js
  participant Axios
  participant FastAPI
  participant Repo
  participant PG

  U->>Next: visit /orders
  Next->>Next: useOrders({page:1})
  Next->>Axios: GET /api/v1/orders?page=1
  Axios->>FastAPI: forward
  FastAPI->>Repo: list_for_user(user)
  Repo->>PG: SELECT ...
  PG-->>Repo: rows
  Repo-->>FastAPI: list
  FastAPI-->>Axios: OrderListResponse
  Axios-->>Next: data
  Next-->>U: render
```

## Auth refresh flow

```mermaid
sequenceDiagram
  participant U as Customer (Browser)
  participant Axios
  participant FastAPI
  participant Repo

  Note over Axios: Access token expired → 401
  Axios->>FastAPI: POST /api/v1/auth/refresh (cookie)
  FastAPI->>Repo: is_refresh_used(jti)?
  alt token reused
    FastAPI->>Repo: revoke all sessions for user
    FastAPI-->>Axios: 401 (TOKEN_REUSE)
    Axios->>U: force logout
  else not used
    FastAPI->>Repo: mark_refresh_used + issue new pair
    FastAPI-->>Axios: 200 + new access + new refresh cookie
    Axios->>Axios: retry original request
  end
```

## Error paths

- Domain errors → JSON envelope with `error.code`
- Validation errors → 422 with field-level `details`
- Auth errors → 401 + force logout if access token cannot be refreshed
- Unhandled → sanitized 500 + Sentry breadcrumb
