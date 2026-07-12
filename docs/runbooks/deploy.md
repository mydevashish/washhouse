# Runbook: Deploy

## Frontend (Vercel)

1. Connect repo; root `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to production API.
3. Deploy `main`; verify `/discover` loads.

## Backend (Railway)

1. Set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RAZORPAY_*`, `CORS_ALLOW_ORIGINS`.
2. Run migrations: `alembic upgrade head`.
3. Health: `GET /api/v1/health`.

## Rollback

- Vercel: promote previous deployment.
- Railway: redeploy previous image; run downgrade migration only if reversible.
