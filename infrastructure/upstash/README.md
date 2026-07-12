# Upstash Redis

Managed Redis (used as cache + Celery broker + rate limiter store).

## Databases

| DB             | Purpose            | Eviction       | TLS  |
| -------------- | ------------------ | -------------- | ---- |
| `dlm-cache`    | App cache          | allkeys-lru    | yes  |
| `dlm-broker`   | Celery broker      | noeviction     | yes  |
| `dlm-rate`     | Rate limiter       | volatile-ttl   | yes  |

> Same physical DB is acceptable in dev; use separate DBs in prod for isolation.

## Connection strings

- `REDIS_URL` — `dlm-cache`
- `CELERY_BROKER_URL` — `dlm-broker`
- `CELERY_RESULT_BACKEND` — `dlm-broker` (or `dlm-cache`)
- `RATE_LIMIT_REDIS_URL` — `dlm-rate`

## Keys + TTLs

- Cache keys: `cache:<feature>:<id>` — TTL ≤ 5 min unless justified
- Idempotency: `idem:<route>:<key>` — TTL 24h
- Rate limit: `rl:<scope>:<id>:<window>` — TTL = window
- Lock: `lock:<resource>:<id>` — TTL ≤ 60s

## Limits

- Connections per service: ≤ 100
- Pipeline batches: ≤ 100 commands

## Observability

- Upstash dashboard
- Alert on:
  - Memory > 80%
  - p95 cmd latency > 20 ms
  - Error rate > 1%
