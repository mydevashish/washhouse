# Runbook: Deploy

## Frontend (Vercel)

1. Connect repo; root `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to production API (must include `/api/v1`, e.g. `https://washhouse.onrender.com/api/v1`).
3. Deploy `main`; verify `/discover` loads.

## Backend (Railway / Render)

1. Set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RAZORPAY_*`, `CORS_ALLOW_ORIGINS`.
2. Run migrations: `alembic upgrade head`.
3. Health: `GET /api/v1/health`.
4. After partner dashboard changes, confirm OpenAPI lists `GET /api/v1/partner/analytics/overview` (401 without auth is OK; **404 means the API image is stale** — redeploy backend from `main`).

### Render (interim production)

Blueprint: `infrastructure/render/render.yaml` (`rootDir: backend`). Trigger **Manual Deploy** on the `dlm-backend` service after merging backend changes, or connect auto-deploy from `main`.

## Rollback

- Vercel: promote previous deployment.
- Railway: redeploy previous image; run downgrade migration only if reversible.
