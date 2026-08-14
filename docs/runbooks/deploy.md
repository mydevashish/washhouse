# Runbook: Deploy

## Frontend (Vercel)

1. Connect repo; root `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to production API (must include `/api/v1`, e.g. `https://washhouse.onrender.com/api/v1`).
3. Deploy `main`; verify `/discover` loads.

## Backend (Render interim + Railway target)

1. Set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RAZORPAY_*`, `CORS_ALLOW_ORIGINS`.
2. Run migrations: `alembic upgrade head`.
3. Health: `GET /api/v1/health`.
4. After partner dashboard / garment catalog changes, smoke partner routes (401 without auth is OK; **404 means the API image is stale**):

```bash
python scripts/smoke_production_api.py
```

### Render (interim production — what Vercel calls today)

Blueprint: `infrastructure/render/render.yaml` (`rootDir: backend`).

**CI:** push to `main` with `backend/**` changes runs `.github/workflows/deploy-backend.yml`, which POSTs `RENDER_DEPLOY_HOOK_URL` then smoke-tests Render.

**One-time setup:** Render dashboard → `dlm-backend` → Settings → **Deploy Hook** → copy URL → GitHub repo → Settings → Secrets → `RENDER_DEPLOY_HOOK_URL`.

**Manual fallback:** Render → `dlm-backend` → **Manual Deploy** → Deploy latest commit.

### Railway (target stack)

`.github/workflows/deploy-backend.yml` also deploys `dlm-backend`, `dlm-worker`, and `dlm-beat` when `RAILWAY_TOKEN` is set. Until `NEXT_PUBLIC_API_URL` points at Railway, Vercel still depends on Render staying current.

## Rollback

- Vercel: promote previous deployment.
- Railway: redeploy previous image; run downgrade migration only if reversible.
