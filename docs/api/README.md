# API Reference

The OpenAPI spec is auto-generated at `/api/v1/openapi.json` and rendered at:

- Swagger UI: `/api/v1/docs`
- ReDoc: `/api/v1/redoc`

This folder contains **curated** reference docs that complement the spec — error codes, conventions, deprecations, and per-resource guides.

## Conventions

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <access_token>`
- All payloads: `application/json` UTF-8
- Pagination: `?page=&page_size=` (max `page_size=100`)
- Filtering: per-endpoint query params, validated by Pydantic
- Sorting: `?sort=field,-other_field`
- Idempotency: `Idempotency-Key` header on money-moving POSTs

## Response envelope

```json
{
  "data": ...,
  "meta": { "request_id": "...", "timestamp": "...", "pagination": { ... } }
}
```

## Error envelope

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": []
  },
  "meta": { "request_id": "...", "timestamp": "..." }
}
```

## Endpoints

Per-resource pages (filled in as endpoints are implemented):

- `endpoints/auth.md`
- `endpoints/users.md`
- `endpoints/laundries.md`
- `endpoints/orders.md`
- `endpoints/payments.md`
- `endpoints/reviews.md`
- `endpoints/subscriptions.md`
- `endpoints/notifications.md`
- `endpoints/admin.md`
- `endpoints/partner-price-list.md` — partner garment catalog prices (Slice B)
- `endpoints/laundry-price-list.md` — public per-laundry garment prices (Slice C)
- `endpoints/marketplace-from.md` — marketplace “from ₹” aggregates for `/pricing` (Slice D)
- `endpoints/laundry-compare-hints.md` — list/search compare price hints for store cards (Slice 5)

## Deprecations

See `deprecations.md`.

## See also

- `.cursor/rules/05-api-standards.md`
- `.cursor/templates/api-endpoint.md`
