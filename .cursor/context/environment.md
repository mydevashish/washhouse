# Environment Variables

> Master reference. Each var documented with purpose, default, and where to set it.

## Backend (`backend/.env`)

| Var                          | Required | Local default                                   | Notes                                       |
| ---------------------------- | -------- | ----------------------------------------------- | ------------------------------------------- |
| `APP_ENV`                    | ✅       | `local`                                         | `local | staging | production`              |
| `LOG_LEVEL`                  | ✅       | `DEBUG`                                         | `INFO` in prod                              |
| `DATABASE_URL`               | ✅       | `postgresql+asyncpg://dlm:dlm_dev_password@db:5432/dlm_db` |                                  |
| `DATABASE_URL_DIRECT`        | ✅       | `postgresql://dlm:dlm_dev_password@db:5432/dlm_db` | Used by Alembic                            |
| `REDIS_URL`                  | ✅       | `redis://redis:6379/0`                          | Cache DB                                    |
| `CELERY_BROKER_URL`          | ✅       | `redis://redis:6379/1`                          |                                             |
| `CELERY_RESULT_BACKEND`      | ✅       | `redis://redis:6379/2`                          |                                             |
| `JWT_PRIVATE_KEY`            | ✅ prod  | dev-only HS256 secret                           | RS256 key in prod                           |
| `JWT_PUBLIC_KEY`             | ✅ prod  | -                                               |                                             |
| `JWT_ALG`                    | ✅       | `HS256` (local) / `RS256` (prod)                |                                             |
| `JWT_ISSUER`                 | ✅       | `dlm`                                            |                                             |
| `ACCESS_TOKEN_TTL_MIN`       | ✅       | `15`                                             |                                             |
| `REFRESH_TOKEN_TTL_DAYS`     | ✅       | `30`                                             |                                             |
| `CORS_ALLOW_ORIGINS`         | ✅       | `http://localhost:3000`                          | Comma-separated, no wildcards in prod      |
| `SENTRY_DSN`                 | ❌ local | -                                                | Required in staging/prod                   |
| `SMTP_HOST` / `SMTP_PORT`    | ❌ local | -                                                | Resend in prod                              |
| `TWILIO_ACCOUNT_SID` / `TOKEN` | ❌ local | -                                              | Twilio for SMS in prod                      |
| `STRIPE_SECRET_KEY`          | ❌ local | -                                                | Stripe                                      |
| `STRIPE_WEBHOOK_SECRET`      | ❌ local | -                                                |                                             |

## Frontend (`frontend/.env.local`)

Next.js loads env in this order (later wins): `.env` → `.env.local` → `.env.development` → `.env.development.local`.

| Var                           | Required | Local default                | Notes                                  |
| ----------------------------- | -------- | ---------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | ✅       | `http://localhost:8000/api/v1` | **Use `.env.local` for local backend.** `frontend/.env` ships with Render URL for reference only. |
| `NEXT_PUBLIC_APP_URL`         | ✅       | `http://localhost:3000`      |                                        |
| `NEXT_PUBLIC_SENTRY_DSN`      | ❌ local | -                            |                                        |
| `NEXT_PUBLIC_POSTHOG_KEY`     | ❌ local | -                            |                                        |
| `NEXT_PUBLIC_POSTHOG_HOST`    | ❌ local | -                            |                                        |
| `SENTRY_AUTH_TOKEN`           | ❌ local | -                            | Sourcemap uploads in CI                |

## Where each env lives

| Env         | Storage                                  |
| ----------- | ---------------------------------------- |
| Local       | `backend/.env`, `frontend/.env.local`    |
| Preview     | Vercel + Railway encrypted env stores    |
| Staging     | Vercel + Railway encrypted env stores    |
| Production  | Vercel + Railway encrypted env stores    |

## Local discovery troubleshooting

**Symptom:** `/discover` shows `0 laundries nearby` or an empty list while the page is still loading.

| Check | Action |
| ----- | ------ |
| API target | Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` and restart `pnpm dev`. Without `.env.local`, the app uses Render from `frontend/.env`. |
| Backend running | `GET http://localhost:8000/api/v1/health` should return 200. |
| Demo seed | Backend `AUTO_SEED_DEMO=true` (default) seeds 3 Bengaluru laundries on startup. Or run `python scripts/seed.py` from `backend/`. |
| Verify data | `GET http://localhost:8000/api/v1/laundries` should return 3 items (`Sparkle Clean Indiranagar`, `Quick Wash Koramangala`, `FreshFold HSR Layout`). |
| Render cold start | Hosted API can take 30–60s to wake; discovery queries retry with a 60s timeout. UI shows skeletons + “Loading laundries…” instead of `0 nearby`. |

## Rotation

- Quarterly rotation of `JWT_PRIVATE_KEY` (issues refresh; current sessions migrate via rotation).
- Stripe keys rotated when team changes.
- Webhook secrets rotated on every endpoint replacement.

## Forbidden

❌ Commit `.env` files (gitignored — except `.env.example`)
❌ Read env via `os.environ.get(...)` in app code — use `app.core.config.settings`
❌ Expose secrets via `NEXT_PUBLIC_*`
