# Prompt: Fix API connectivity & environment

Act as **devops-engineer** with **backend-architect** support.

## Prerequisite

Run `.cursor/prompts/diagnose-api-errors.md` first. Only proceed if failures are **Category A, B, or G** (network, env, CORS, rate limit).

## Goal

Every client can reach `GET /api/v1/health` and authenticated calls return HTTP responses (not connection errors).

## Checklist

### 1. Environment parity

| Variable | Frontend | Backend | Must match |
| -------- | -------- | ------- | ---------- |
| API URL | `NEXT_PUBLIC_API_URL` | — | `http://localhost:{PORT}/api/v1` |
| App origin | `NEXT_PUBLIC_APP_URL` | `CORS_ALLOW_ORIGINS` | `http://localhost:3000` |
| Port | — | `PORT` | `8000` (default) |

Copy templates if missing:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

**Common mistake:** `NEXT_PUBLIC_API_URL=http://localhost:8000` (missing `/api/v1` suffix).

Validated in `frontend/lib/env.ts` — restart `pnpm dev` after any change.

### 2. Start backend with dependencies

```bash
# Postgres + Redis (docker-compose if available, or local installs)
cd backend
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl -s http://localhost:8000/api/v1/health
# Expect: {"data":{"status":"ok",...},"meta":{...}}
```

### 3. CORS

In `backend/.env`:

```
CORS_ALLOW_ORIGINS=http://localhost:3000
```

For staging/production, add the Vercel URL. Check `backend/app/core/config.py` for how origins are parsed.

Browser symptom: `Access-Control-Allow-Origin` missing on preflight OPTIONS.

### 4. Redis & rate limiting

`backend/app/middleware/rate_limit.py` applies limits when `RATE_LIMIT_ENABLED=true`.

Symptoms:
- 429 on `/api/v1/auth/*` after rapid login attempts
- Middleware timeout if Redis unreachable

Fix:
- Ensure `REDIS_URL` points to running Redis
- Or set `RATE_LIMIT_ENABLED=false` in local `.env` while debugging

### 5. Database migrations

```bash
cd backend && alembic upgrade head && alembic current
```

Recent marketing tables: `backend/alembic/versions/20260713_0032_marketing_tables.py`

If endpoints 500 with `relation "..." does not exist` → migration not applied.

### 6. Frontend network error UX

Confirm `frontend/lib/api-errors.ts` message appears on login when API is down:

- `isNetworkError(err)` → `getNetworkErrorMessage()`
- Used in `frontend/app/login/page.tsx`

Ensure other entry points (discover, admin) also distinguish network vs API errors — not infinite spinners.

### 7. Production / staging (Render + Vercel)

Per `frontend/.env.example`:

```
NEXT_PUBLIC_API_URL=https://washhouse.onrender.com/api/v1
NEXT_PUBLIC_APP_URL=https://washhouse.vercel.app
```

Backend `CORS_ALLOW_ORIGINS` must include the Vercel domain.

Run remote health:

```bash
curl -s https://washhouse.onrender.com/api/v1/health
```

### 8. Tests

```bash
cd backend && pytest tests/api/test_health.py -q
```

## Done when

- [ ] `curl` health returns 200 locally
- [ ] Browser Network tab shows responses (not failed/canceled) for `/api/v1/laundries`
- [ ] No CORS errors in console
- [ ] `logs/bug-tracker.md` connectivity bugs marked resolved

## Log

Update `logs/implementation-log.md` with env fixes applied.
