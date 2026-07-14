# Prompt: API production-ready — master checklist

Act as **product-manager** orchestrating **backend-architect**, **frontend-architect**, **qa-engineer**, and **devops-engineer**.

## Goal

Eliminate API loading/CRUD failures across **customer**, **partner**, and **admin** surfaces. Every screen should load data, mutate successfully, and show actionable errors — not infinite spinners or silent failures.

## Symptoms (reported)

- Pages stuck on loading or showing generic errors
- CRUD (create/read/update/delete) failing on user, admin, and partner dashboards
- Possible causes: env mismatch, auth/session, FE↔BE contract drift, missing migrations, CORS, Redis rate-limit, wrong response envelope parsing

## Architecture map (read first)

| Layer | Location |
| ----- | -------- |
| Axios client + interceptors | `frontend/lib/api.ts` |
| Network / connectivity helpers | `frontend/lib/api-errors.ts`, `frontend/lib/connectivity.ts` |
| Error message extraction | `frontend/lib/api-error-message.ts`, `frontend/lib/api-field-errors.ts` |
| FE service modules (35 files) | `frontend/services/*.ts`, `frontend/lib/api/marketing.ts` |
| Auth + token wiring | `frontend/services/auth.ts`, `frontend/components/auth/auth-bootstrap.tsx` |
| BE router aggregation | `backend/app/api/v1/router.py` |
| BE error envelope | `backend/app/middleware/error_handler.py`, `backend/app/core/exceptions.py` |
| Rate limiting | `backend/app/middleware/rate_limit.py` |
| Env templates | `frontend/.env.example`, `backend/.env.example` |

## Execution order (run as separate Cursor tasks)

### Phase 0 — Diagnose root cause (DO THIS FIRST)

Paste and run: `.cursor/prompts/diagnose-api-errors.md`

Output: a prioritized bug list in `logs/bug-tracker.md` with HTTP status, endpoint, role, and root-cause category per failure.

### Phase 1 — Connectivity & environment

Paste and run: `.cursor/prompts/fix-api-connectivity-env.md`

- Backend reachable at `NEXT_PUBLIC_API_URL`
- CORS, DB migrations, Redis (if rate-limit enabled)
- Health endpoint green

### Phase 2 — Auth & session

Paste and run: `.cursor/prompts/fix-api-auth-session.md`

- Login/refresh/logout for customer, partner, admin roles
- Bearer token attached before guarded calls
- Server restart / `FORCE_LOGOUT_ON_RESTART` handled gracefully

### Phase 3 — FE↔BE contracts

Paste and run: `.cursor/prompts/fix-api-frontend-contracts.md`

- Path, method, query params, request body, response envelope alignment
- `data.data` vs raw array vs `{ items, total }` shape mismatches

### Phase 4 — CRUD by role

Paste and run: `.cursor/prompts/fix-api-crud-by-role.md`

Sweep customer → partner → admin CRUD flows end-to-end.

### Phase 5 — Integration test matrix

Paste and run: `.cursor/prompts/api-integration-test-matrix.md`

Backfill pytest + Playwright coverage for every fixed endpoint.

## Quick local smoke (run before Phase 0)

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && pnpm dev

# Terminal 3 — health
curl -s http://localhost:8000/api/v1/health | jq .

# Open browser DevTools → Network → filter XHR; note failing URLs + status codes
```

## Rules to follow

- `.cursor/rules/05-api-standards.md`, `06-error-handling.md`, `09-security.md`
- `.cursor/rules/14-state-management.md` (TanStack Query patterns)
- Minimize scope — fix the contract, not refactor unrelated code
- Do not commit `.env` / `.env.local`

## Done when (production checklist)

- [ ] `GET /api/v1/health` returns 200 locally and on staging
- [ ] `NEXT_PUBLIC_API_URL` matches backend `PORT` + `/api/v1` suffix
- [ ] Customer: discover, orders, account, checkout — load + mutate without errors
- [ ] Partner: dashboard, orders, staff, service catalog, settlements — load + mutate
- [ ] Admin: dashboard, laundries, customers, disputes, platform config — load + mutate
- [ ] 401 → refresh or redirect to login; 403 → access denied; 422 → field errors; network down → clear message
- [ ] No page shows infinite loading when API returns 4xx/5xx (must show `ErrorState` or toast)
- [ ] `backend/tests/api/` green for all touched endpoints
- [ ] `logs/bug-tracker.md` updated; all SEV1/SEV2 API bugs resolved
- [ ] `logs/implementation-log.md` updated

## If blocked

Stop and file an ADR if the root cause requires breaking API version changes (`/api/v2`).
