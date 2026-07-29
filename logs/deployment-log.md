# Deployment Log

> Every prod + staging deploy. Newest first.

## Entry template

```
### YYYY-MM-DD HH:MM — <env> — <release tag / sha>
- **Deployer:** <name>
- **Services:** frontend / backend / worker
- **Migrations:** yes / no — <list>
- **Feature flags:** <toggled flags>
- **Smoke tests:** pass / fail
- **Rollback plan:** redeploy `<previous sha>`
- **Notes:** ...
```

## History

### 2026-07-28 ~15:30 IST — production GO/NO-GO review — **NO-GO** (no deploy)

- **Deployer:** product-manager + devops-engineer (Cursor)
- **Env:** launch gate review (local journeys + live interim probes)
- **Services:** none promoted
- **Migrations:** n/a
- **Feature flags:** soft-launch path would require `FEATURE_ONLINE_BOOKING=false` / COD-only
- **Smoke tests:**
  - Local Customer / Partner / Admin Playwright → **PASS** (7/7, 10/10, 5/5)
  - Render `GET /api/v1/health` → **PASS** 200 (re-probed)
  - Render `GET /api/v1/health/db` + `/health/redis` → **FAIL** 404
  - BUG-001 forgot-password UI → **FAIL** open
- **Rollback plan:** documented on paper; previous deploy IDs + Neon PITR **not** confirmed
- **Notes:** Executive verdict **NO-GO**. P0/P1 not empty (BUG-001, staging health bug formally open, CI remote unconfirmed). Stubs (Checkout.js, WhatsApp, subscriptions) acceptable only for offline soft launch with signed exception — not full prod. Full report: `logs/production-readiness-2026-07-28.md`

### 2026-07-28 ~10:45 IST — local pre-flight — no deploy

- **Deployer:** devops-engineer + qa-engineer (Cursor)
- **Env:** local (Postgres up; Redis down; Docker unavailable)
- **Services:** backend uvicorn `:8000` started; frontend smoke via Playwright webServer
- **Migrations:** already at head `20260717_0034` (AUTO_RUN confirmed up-to-date)
- **Feature flags:** `RATE_LIMIT_ENABLED=false`, `CACHE_ENABLED=false`; FE online-booking follows env (`frontend/.env` = false)
- **Smoke tests:**
  - `GET /api/v1/health` → **PASS** 200
  - `POST /api/v1/auth/login` → **PASS** 200
  - Playwright `smoke.spec.ts` chromium → **PASS** 2/2
  - pytest → **FAIL** 84 setup errors (logged BUG-2026-07-28-002)
  - staging Render health → **FAIL** timeout (BUG-2026-07-28-003)
- **Env fix:** `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- **Rollback plan:** n/a (no deploy)
- **Notes:** Ready for local role testing. Staging/production still blocked on Render health + known Phase-6 items.

### 2026-07-13 14:00 — staging prep — production readiness (no deploy)

- **Deployer:** devops-engineer (Cursor)
- **Env:** staging prep / production **blocked**
- **Commit:** `dff9403` (main)
- **Services:** frontend CI fixed; backend Render health **FAIL**; staging.dlm.app unreachable
- **Migrations:** head `20260703_0031` reviewed — 3 irreversible enum downgrades documented
- **Feature flags:** `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true` (prod default)
- **Smoke tests:** partial — Vercel frontend PASS; API flows SKIP (backend down)
- **Rollback plan:** see `docs/deployment/production-readiness-v0.1.0.md` §7
- **Notes:** DO NOT deploy until Phase 0–2 blockers fixed (BUG-001, staging health, CI green on remote). Full report: `docs/deployment/production-readiness-v0.1.0.md`

_(First production deploy will append a `v0.1.0` entry here.)_
