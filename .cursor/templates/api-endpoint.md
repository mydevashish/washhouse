# <METHOD> <path>

> Tags: <resource> · Auth: customer | partner | admin · Version: v1

## Summary

One line describing what it does.

## Description

A paragraph for the full context.

## Request

### Path params

| Name        | Type | Required | Description |
| ----------- | ---- | -------- | ----------- |
| `order_id`  | UUID | ✅        | ...         |

### Query params

| Name        | Type   | Default | Allowed       | Description |
| ----------- | ------ | ------- | ------------- | ----------- |
| `page`      | int    | 1       | ≥ 1           | ...         |
| `page_size` | int    | 20      | 1..100        | ...         |

### Body (`application/json`)

```json
{
  "field": "value"
}
```

Schema: `app/schemas/<resource>.py::<SchemaName>`.

## Response (200/201)

```json
{
  "data": { ... },
  "meta": { "request_id": "req_...", "timestamp": "..." }
}
```

## Errors

| Status | Code                          | When                         |
| ------ | ----------------------------- | ---------------------------- |
| 401    | AUTH_FAILED                   | Missing/invalid token        |
| 403    | FORBIDDEN                     | Wrong role                   |
| 404    | <RESOURCE>_NOT_FOUND          | Not visible to the caller    |
| 409    | <RESOURCE>_INVALID_TRANSITION | Bad state transition         |
| 422    | VALIDATION_FAILED             | Schema invalid               |
| 429    | RATE_LIMITED                  | Throttled                    |

## Side effects

- Celery: `<task name>` queued on success.
- Cache: invalidates `<prefix>`.
- Audit log: <yes/no, fields>.

## Notes

- Idempotency: `<yes/no>` (header `Idempotency-Key`)
- Permission notes

## Examples

```bash
curl -X POST https://api.dlm.app/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"laundry_id":"01HZ...","pickup_address_id":"01HZ...","scheduled_at":"2026-06-01T10:00:00Z"}'
```
