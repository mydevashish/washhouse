# New Celery Task Checklist

## Design

- [ ] Worthy of a task (long, external I/O, retryable, scheduled)
- [ ] Idempotent — safe to run twice
- [ ] Inputs are IDs / primitives — not ORM objects

## Code

- [ ] Registered with `@celery_app.task(name="<domain>.<task>")`
- [ ] `autoretry_for`, `retry_backoff`, `retry_jitter`, `max_retries`
- [ ] `soft_time_limit` + `time_limit`
- [ ] Structured logs at start / ok / retry / failed
- [ ] DB session managed within the task (not shared from request)

## Testing

- [ ] Eager-mode test for happy path
- [ ] Test retries (mock first N calls to fail)
- [ ] Test final failure (max retries exceeded)

## Scheduling (if applicable)

- [ ] Beat schedule entry in `celery_app.py`
- [ ] Documented in `docs/backend/tasks.md`

## Observability

- [ ] Sentry breadcrumb / span
- [ ] Logs include all relevant IDs (order_id, user_id, etc.)

## Docs / logs

- [ ] `docs/backend/tasks.md` updated
- [ ] `logs/implementation-log.md` updated
