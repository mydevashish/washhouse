---
description: REST API design standards
globs: backend/**
alwaysApply: false
---

# API Standards

## Base URL & versioning

```
https://api.dlm.app/api/v1/...
```

- All routes live under `/api/v1`.
- Breaking changes require a new version (`/api/v2`).
- Use the `X-API-Version` response header.

## Resource design

- Resources are **plural nouns**: `/laundries`, `/orders`, `/users`
- Nest only one level: `/orders/{order_id}/items` ✅, but not `/users/{user_id}/orders/{order_id}/items` ❌ — filter via query.
- Use sub-resources for actions when non-CRUD: `POST /orders/{order_id}/cancel`.

## HTTP methods

| Verb     | Purpose                            | Idempotent | Body |
| -------- | ---------------------------------- | ---------- | ---- |
| `GET`    | Read                               | ✅          | No   |
| `POST`   | Create / non-idempotent action     | ❌          | Yes  |
| `PUT`    | Full replace                       | ✅          | Yes  |
| `PATCH`  | Partial update                     | ❌          | Yes  |
| `DELETE` | Delete (soft preferred)            | ✅          | Optional |

## Status codes

| Code | Meaning                          | When                                       |
| ---- | -------------------------------- | ------------------------------------------ |
| 200  | OK                               | Successful GET/PATCH/PUT/DELETE            |
| 201  | Created                          | Successful POST that created a resource    |
| 202  | Accepted                         | Async work queued                          |
| 204  | No Content                       | DELETE with no body                        |
| 400  | Bad Request                      | Malformed request                          |
| 401  | Unauthorized                     | No / invalid auth                          |
| 403  | Forbidden                        | Authenticated but no permission            |
| 404  | Not Found                        | Resource missing                           |
| 409  | Conflict                         | Duplicate / state conflict                 |
| 422  | Unprocessable Entity             | Validation failed                          |
| 429  | Too Many Requests                | Rate limited                               |
| 500  | Internal Server Error            | Unhandled                                  |

## Response envelope

### Success

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_01HZ...",
    "timestamp": "2026-05-25T10:30:00Z"
  }
}
```

### List

```json
{
  "data": [ ... ],
  "meta": {
    "request_id": "req_...",
    "timestamp": "...",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 134,
      "total_pages": 7
    }
  }
}
```

### Error

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with id 01HZ... not found",
    "details": [
      { "field": "order_id", "issue": "Does not exist" }
    ]
  },
  "meta": {
    "request_id": "req_...",
    "timestamp": "..."
  }
}
```

## Error codes (machine-readable)

Format: `<DOMAIN>_<REASON>` in `UPPER_SNAKE_CASE`.

Examples:
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `ORDER_NOT_FOUND`
- `ORDER_INVALID_TRANSITION`
- `LAUNDRY_NOT_APPROVED`
- `PAYMENT_DECLINED`
- `VALIDATION_FAILED`

## Pagination

- **Default page size:** 20. **Max:** 100.
- Query params: `page` (1-based) and `page_size`.
- Response includes `meta.pagination`.
- For infinite scroll / feeds, also support cursor pagination via `cursor`.

```
GET /api/v1/orders?page=2&page_size=20
GET /api/v1/orders?cursor=eyJpZCI6IjAxSF...
```

## Filtering, sorting, searching

```
GET /api/v1/laundries?city=mumbai&min_rating=4&sort=-rating,name
GET /api/v1/orders?status=delivered&from=2026-05-01&to=2026-05-31
GET /api/v1/laundries?q=quick%20wash
```

- `sort` accepts comma-separated fields; `-` for descending.
- Allow only whitelisted sort fields per endpoint (defined in the schema).
- Free-text search uses `q` and is rate-limited + debounced on the client.

## Authentication

- Bearer JWT in `Authorization: Bearer <token>`.
- Access tokens — 15 min TTL.
- Refresh tokens — 30 day TTL, stored httpOnly cookie or secure storage.
- `POST /api/v1/auth/refresh` rotates the refresh token (one-time use).

## Headers

Required on every response:

| Header                          | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `X-Request-ID`                  | Correlates client + server logs          |
| `X-RateLimit-Limit`             | Bucket size                              |
| `X-RateLimit-Remaining`         | Remaining requests                       |
| `X-RateLimit-Reset`             | Unix epoch reset                         |
| `Content-Type: application/json`|                                          |
| Standard security headers       | See `09-security.md`                     |

## Rate limiting

Default per IP + per user:

| Tier            | Limit                |
| --------------- | -------------------- |
| Anonymous       | 60 req / min         |
| Authenticated   | 300 req / min        |
| Login endpoint  | 10 req / 15 min      |
| OTP request     | 5 req / hour         |
| Admin endpoints | 600 req / min        |

Exceed → 429 with `Retry-After`.

## Idempotency

For `POST` that creates money-movement or external side effects (payments, orders), accept `Idempotency-Key` header. Store the request hash + response for 24 h.

## OpenAPI

- FastAPI auto-generates `/api/v1/openapi.json`.
- Every endpoint MUST have:
  - `summary`
  - `description`
  - `response_model`
  - `responses={...}` for non-200 documented statuses
  - `tags=["<resource>"]`

## Deprecation

- Mark deprecated endpoints with `Deprecation: true` header + `Sunset: <RFC1123 date>`.
- Document in `docs/api/deprecations.md`.

## Examples (canonical)

```python
@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order",
    description="Customer creates a new pickup order for a chosen laundry.",
    responses={
        409: {"description": "Order conflict"},
        422: {"description": "Validation error"},
    },
    tags=["orders"],
)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_customer),
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    order = await service.create(user=current_user, payload=payload)
    return OrderResponse.model_validate(order)
```
