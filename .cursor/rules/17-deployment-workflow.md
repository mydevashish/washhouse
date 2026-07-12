---
description: Deployment workflow across Vercel, Railway, Neon
alwaysApply: false
---

# Deployment Workflow

## Environments

| Env         | Branch     | Frontend          | Backend            | DB                | Domain                    |
| ----------- | ---------- | ----------------- | ------------------ | ----------------- | ------------------------- |
| Production  | `main`     | Vercel (prod)     | Railway (prod)     | Neon prod         | `dlm.app`                 |
| Staging     | `develop`  | Vercel (preview-promoted) | Railway (staging) | Neon staging | `staging.dlm.app`         |
| Preview     | PR         | Vercel preview    | Railway preview env | Neon branch     | `pr-<n>.dlm.app`          |
| Local       | -          | `pnpm dev`        | `uvicorn --reload` | Postgres local    | `localhost:3000 / 8000`   |

## Promotion flow

```
feature branch ──► PR ──► develop (auto-deploy staging)
                                     │
                                     ▼
                      QA / canary / smoke tests
                                     │
                                     ▼
                       PR develop → main ──► auto-deploy prod
```

## Frontend (Vercel)

- **Connected to GitHub.** Auto-deploys.
- **Environments:**
  - `main` → Production
  - `develop` → Preview promoted to staging
  - PRs → Preview URLs
- **Env vars:** managed in Vercel dashboard; mirrored documentation in `infrastructure/vercel/env.md`.
- **`vercel.json`** in `frontend/` controls headers, redirects, regions.
- **Build command:** `pnpm build`. **Output:** `.next`.
- **Edge regions:** prefer `bom1`, `iad1`.

## Backend (Railway)

- **Service definition:** `infrastructure/railway/railway.json`.
- **Connected to GitHub.** Auto-deploys per environment.
- **Dockerfile:** `backend/Dockerfile` (multi-stage; `prod` target).
- **Health check:** `GET /api/v1/health`.
- **Migrations:** run **before** server start via release command:
  ```
  alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Worker service:** runs Celery (`celery -A app.tasks.celery_app worker`).
- **Beat service:** runs `celery beat`.

## Database (Neon)

- Branching for preview envs.
- Prod database has PITR enabled (7 days).
- Connection string in `DATABASE_URL`.
- Use `PgBouncer` URL for app, direct URL for migrations.

## Redis (Upstash)

- Two databases:
  - DB 0 — cache
  - DB 1 — Celery broker
  - DB 2 — Celery result backend
- Connection strings in `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.

## CI gates before deploy

1. Lint + type-check (frontend + backend)
2. Unit + integration tests
3. E2E smoke (key routes only on PR; full on develop/main)
4. Lighthouse CI on touched routes (frontend)
5. `pip-audit` + `npm audit`
6. Build artifacts produced

## Release process

1. Open PR `develop` → `main`.
2. Review diff + log entries.
3. Approve + squash-merge.
4. Tag `v<MAJOR>.<MINOR>.<PATCH>`.
5. Vercel + Railway auto-deploy.
6. Smoke test in prod (checklist in `.cursor/checklists/post-deploy.md`).
7. Append entry to `logs/deployment-log.md`.

## Rollback

- **Frontend:** Vercel → Deployments → Promote previous.
- **Backend:** Railway → Deployments → Redeploy previous image.
- **DB:** Only roll forward (Alembic). For severe schema issues, point-in-time recovery via Neon.

Always log the rollback in `logs/deployment-log.md` and create a follow-up bug entry.

## Feature flags

- Use a lightweight flag system via DB `feature_flags` table + Redis cache.
- New risky features ship behind a flag.
- Flags removed within 2 releases of full rollout.

## Secrets management

- Stored in Vercel + Railway encrypted env stores.
- Documented (names + owners, never values) in `infrastructure/<provider>/secrets.md`.
- Rotated quarterly.

## Observability stack

- **Sentry** — frontend + backend errors & performance traces
- **Better Stack / Datadog** *(optional)* — log aggregation
- **Vercel Analytics** — RUM
- **Railway metrics** — backend resource usage

## Mandatory checklist post-deploy

See `.cursor/checklists/post-deploy.md`. TL;DR:
- ✅ `/api/v1/health` returns 200
- ✅ Login + place order smoke test
- ✅ No spike in Sentry errors (5-min window)
- ✅ p95 latency unchanged
- ✅ Deploy logged in `logs/deployment-log.md`
