# DLM — Local setup (what you do vs what the repo provides)

## What you must do yourself

### 1. Prerequisites (install once)

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Postgres, Redis, optional full stack |
| [Node.js](https://nodejs.org/) | ≥ 20 | Frontend |
| [pnpm](https://pnpm.io/) | 9.x | Frontend package manager |
| [Python](https://www.python.org/) | 3.12 | Backend (if not using Docker for API) |

### 2. Option A — Full stack with Docker (recommended)

```powershell
cd "c:\Users\DevashishDas\Downloads\Office Project\DLM"

# Copy env files (required — Docker backend reads backend/.env)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local

# Start Postgres + Redis + API + worker + frontend
docker compose up -d --build db redis
docker compose up -d --build backend worker frontend
```

- **Postgres:** `localhost:5432`, user `dlm`, password `dlm_dev_password`, db `dlm_db`
- **Redis:** `localhost:6379`
- **API:** http://localhost:8000/api/v1/docs
- **Frontend:** http://localhost:3000

Migrations run automatically when the `backend` container starts (`alembic upgrade head`).

### 3. Option B — Backend in a Python virtualenv (you manage DB)

Use this if you prefer running FastAPI on the host while Postgres/Redis run in Docker.

```powershell
cd "c:\Users\DevashishDas\Downloads\Office Project\DLM"

# Start only database services
docker compose up -d db redis

# Backend virtualenv
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt

copy .env.example .env
# Edit .env if needed — defaults match docker-compose db/redis

# Migrations run automatically on API startup (AUTO_RUN_MIGRATIONS=true).
# To apply manually instead: alembic upgrade head

# Seed demo data (optional — from repo root)
python ..\scripts\seed_marketplace.py

# Run API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In a **second terminal** (frontend):

```powershell
cd frontend
pnpm install
copy .env.example .env.local
pnpm dev
```

### 4. Secrets you configure later (not required for Phase 1)

| Variable | When needed |
|----------|-------------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Week 10+ payments |
| `GOOGLE_CLIENT_ID` | Google login |
| `TWILIO_*` or `MSG91_*` | Production SMS OTP |
| `RESEND_API_KEY` | Production email |
| `SENTRY_DSN` | Staging/production monitoring |

For **local OTP**, set `OTP_DEBUG=true` in `backend/.env` — the API returns the OTP in the JSON response (dev only).

### 5. Verify installation

```powershell
# Health
curl http://localhost:8000/api/v1/health

# Register (example)
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"you@example.com","password":"SecurePass123!","full_name":"Dev Test"}'
```

## What the codebase provides

- Docker Compose for Postgres 16 + Redis 7
- Alembic migrations (applied on backend start or via `alembic upgrade head`)
- FastAPI app with auth, users, health endpoints (Phase 1+)
- Next.js frontend with auth UI and discover shell

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `backend/.env` missing | `copy backend\.env.example backend\.env` |
| Port 5432 in use | Stop other Postgres or change port in `docker-compose.yml` |
| `alembic` command not found | Activate `.venv` and `pip install -r requirements/dev.txt` |
| No tables in DB | Ensure Postgres is up; restart API (auto-migrates) or run `alembic upgrade head` |
| Disable auto-migrate | Set `AUTO_RUN_MIGRATIONS=false` in `backend/.env` |
| Frontend env validation error | Copy `frontend/.env.example` → `frontend/.env.local` |
| Migrations fail on Windows path | Run from `backend/` directory with `DATABASE_URL_DIRECT` set |

See also [`scripts/README.md`](scripts/README.md) and [`docker/README.md`](docker/README.md).
