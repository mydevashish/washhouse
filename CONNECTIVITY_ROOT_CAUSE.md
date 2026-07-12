# Connectivity Root Cause — "Cannot reach server"

**Date:** 2026-06-03

---

## Root cause

**Port mismatch between frontend API URL and the running backend process.**

| Setting | Value (broken state) | Actual backend |
| ------- | -------------------- | -------------- |
| `frontend/.env` → `NEXT_PUBLIC_API_URL` | `http://localhost:8001/api/v1` | — |
| `backend/.env` → `PORT` | `8001` | — |
| Uvicorn command (terminal) | — | `--port 8000` |

The frontend sent login requests to **port 8001**. Nothing was listening there (connection timeout). Axios had **no HTTP response**, so the login page treated it as a network failure and showed *"Cannot reach server — check your connection"*.

This was **not** CORS, database, Redis, or JWT. The API on **8000** was healthy.

---

## Evidence

### Service status (investigation)

| Service | Status |
| ------- | ------ |
| Frontend (`npm run dev`) | Running on `:3000` |
| Backend (uvicorn) | Running on **`0.0.0.0:8000`** |
| Database | OK (migrations + seed in startup logs) |
| Redis | Not required for login (rate limit/cache disabled in `.env`) |
| Docker / workers | Not used for this dev session |

### HTTP probes (PowerShell)

```
GET http://localhost:8000/api/v1/health  → 200 {"status":"ok",...}
GET http://localhost:8001/api/v1/health  → timeout (no listener)

POST http://localhost:8000/api/v1/auth/login → 200
POST http://localhost:8001/api/v1/auth/login → timeout
```

### Backend logs

- Startup complete, no traceback
- Prior `AUTH_SESSION_INVALIDATED` on protected routes (separate session issue; login itself never reached API on 8001)

### Frontend

- Next.js loaded `Environments: .env`
- `NEXT_PUBLIC_API_URL` pointed at **8001**
- Login `catch` branch: no `err.response` → generic "Cannot reach server"

---

## Environment issues found

1. **`.env` update set API URL to 8001** while dev habit / terminal uses **`uvicorn ... --port 8000`**.
2. **`backend/.env` `PORT=8001`** is not read by a manual uvicorn CLI (only documents intent).
3. **`.env.example` files disagreed** with `docker-compose.yml`, `SETUP.md`, and actual uvicorn command (8000 vs 8001).

No `.env.local` or `.env.development` overrides were present.

---

## Changes made

| File | Change |
| ---- | ------ |
| `frontend/.env` | `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` |
| `frontend/.env.example` | Default `:8000` + comment to keep in sync with `PORT` |
| `backend/.env` | `PORT=8000` |
| `backend/.env.example` | `PORT=8000` + sync note |
| `frontend/lib/api-errors.ts` | `isNetworkError`, `getNetworkErrorMessage()` (uses env URL, not hardcoded port) |
| `frontend/lib/connectivity.ts` | Health check helper + logging |
| `frontend/components/providers/api-connectivity.tsx` | Dev-only startup diagnostics |
| `frontend/providers/index.tsx` | Mount diagnostics provider |
| `frontend/app/login/page.tsx` | Distinguish network vs API error messages |
| `backend/scripts/run_dev.ps1` | Start uvicorn using `PORT` from `backend/.env` |

---

## Validation

After updating `.env` and **restarting `npm run dev`**:

| Check | Expected |
| ----- | -------- |
| `GET {NEXT_PUBLIC_API_URL}/health` | 200 |
| Login | 200, redirect to app |
| Console `[info] connectivity.check` | `ok: true` |
| No "Cannot reach server" on login | Pass |

**Important:** Changing `NEXT_PUBLIC_*` requires a **frontend restart**. Backend can keep running on 8000.

### Keep ports aligned

1. Set `PORT` in `backend/.env`.
2. Set `NEXT_PUBLIC_API_URL=http://localhost:<PORT>/api/v1` in `frontend/.env`.
3. Start API with `backend/scripts/run_dev.ps1` **or** `uvicorn ... --port <PORT>` using the **same** number.

---

## Related

- `AUTH_ROOT_CAUSE.md` — JWT `sid` / forced logout loop (fixed separately)
- `SETUP.md` — documents port 8000 for local dev
