# Sentry

Error tracking + performance.

## Projects

- `dlm-frontend` — Next.js (browser + server)
- `dlm-backend`  — FastAPI
- `dlm-worker`   — Celery

## Environments

- `production`
- `staging`
- `development` (opt-in)

## Releases

- Tag each deploy with the git SHA
- Source maps uploaded on every frontend build via `SENTRY_AUTH_TOKEN`

## Sampling

- `traces_sample_rate`:
  - prod: 0.1
  - staging: 1.0
- `profiles_sample_rate`:
  - prod: 0.05
  - staging: 0.5

## PII

- `send_default_pii = False`
- Use `before_send` to scrub `password`, `token`, `secret`, `authorization`, card numbers, emails, phone

## Alerts

- New issue in `production` → Slack `#alerts`
- Spike (>5x in 1h) → PagerDuty
- p95 transaction > 1s for 5m → Slack `#perf`

## Runbook

See `docs/security/threat-model.md` and `docs/deployment/*` for incident response.
