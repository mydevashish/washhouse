# Prompt: Diagnose API errors — root cause investigation

Act as **qa-engineer** with **backend-architect** and **frontend-architect** support.

## Goal

Produce a **prioritized, evidence-backed bug list** for every API failure — not guesses. Do not fix anything until the inventory is complete.

## Inputs (fill in before running)

- Environment: **local | staging | production**
- Failing roles: **customer | partner | admin | all**
- Example failing pages: **<list routes, e.g. /discover, /admin/customers, /partner/orders>**
- Browser console / Network tab screenshots or status codes if available

## Steps

### 1. Read project context

- `.cursor/rules/05-api-standards.md`, `06-error-handling.md`
- `frontend/lib/api.ts` — axios baseURL, interceptors, session invalidation
- `backend/app/api/v1/router.py` — all registered routers
- `logs/bug-tracker.md` — avoid duplicating resolved bugs

### 2. Verify infrastructure (5 min)

```bash
# Backend health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health

# Env alignment
grep NEXT_PUBLIC_API_URL frontend/.env.local 2>/dev/null || grep NEXT_PUBLIC_API_URL frontend/.env 2>/dev/null
grep "^PORT=" backend/.env 2>/dev/null

# DB migrations applied?
cd backend && alembic current
```

Record: API reachable? Port match? Migrations at head?

### 3. Classify each failure (use this taxonomy)

| Category | Signals | Likely fix phase |
| -------- | ------- | ---------------- |
| **A — Network** | No HTTP response, `ERR_CONNECTION_REFUSED`, axios `response === undefined` | `fix-api-connectivity-env.md` |
| **B — Env/CORS** | CORS error in console, wrong host, mixed http/https | `fix-api-connectivity-env.md` |
| **C — Auth** | 401 on guarded routes, missing `Authorization` header, refresh loop | `fix-api-auth-session.md` |
| **D — Authz** | 403 with valid token, wrong role | `fix-api-auth-session.md` |
| **E — Contract** | 404 wrong path, 422 validation, FE parses `data` wrong shape | `fix-api-frontend-contracts.md` |
| **F — Server** | 500, stack trace in backend logs | backend service/repository fix |
| **G — Rate limit** | 429, especially on `/auth` or marketing forms | `fix-api-connectivity-env.md` |
| **H — Client logic** | API returns 200 but UI shows empty/loading (see BUG-2026-07-13-002) | `fix-api-frontend-contracts.md` |

### 4. Build the endpoint inventory

For each role, open the app in browser with DevTools → Network (XHR only). Record:

```
| # | Page route | HTTP | Method | Endpoint | Status | error.code | Category | Notes |
```

**Customer surfaces to sweep:**

- `/discover`, `/discover/[slug]`, `/orders`, `/account`, `/checkout/[laundryId]`
- Services: `frontend/services/laundries.ts`, `orders.ts`, `users.ts`, `payments.ts`

**Partner surfaces:**

- `/partner/*` (dashboard, orders, staff, service catalog, settlements, operations)
- Services: `frontend/services/partner.ts`, `operations.ts`, `staff-management.ts`, `partner-service-catalog.ts`, `partner-settlements` via `settlements.ts`

**Admin surfaces:**

- `/admin/*` (dashboard, laundries, customers, disputes, platform config, announcements)
- Services: `frontend/services/admin.ts`, `disputes.ts`, `platform-config.ts`, `announcements.ts`

**Marketing (public, no auth):**

- `/`, `/contact`, `/franchise` — `frontend/lib/api/marketing.ts`

### 5. Cross-check FE service → BE endpoint

For each failing row in the inventory:

1. Find the `api.get/post/patch/delete` call in `frontend/services/*.ts`
2. Find the matching `@router` in `backend/app/api/v1/endpoints/*.py`
3. Compare: path, HTTP method, query param names (`page` vs `page_size` vs `sort_by`), request body fields, response shape (`data` array vs `{ items, total }` vs paginated `meta.pagination`)

Use OpenAPI as source of truth:

```bash
curl -s http://localhost:8000/api/v1/openapi.json | jq '.paths | keys[]' | head -40
```

### 6. Reproduce with curl (authenticated)

```bash
# Login (adjust credentials for your seed user)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"..."}' \
  -c /tmp/cookies.txt | jq -r '.data.access_token')

# Hit failing endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/dashboard | jq .
```

Repeat for partner and customer seed accounts.

### 7. Check backend logs for 500s

```bash
# While reproducing in browser, watch backend terminal for tracebacks
```

Correlate `X-Request-ID` from response headers with structlog output.

### 8. Write bug entries

For each distinct root cause, add to `logs/bug-tracker.md` using `.cursor/templates/bug-report.md`:

- Severity: SEV1 if CRUD blocked for a whole role; SEV2 if partial; SEV3 if cosmetic error message
- Include: exact endpoint, status, `error.code`, category (A–H), assigned fix phase

### 9. Deliverable

Post a summary table:

1. **P0** — blocks all API calls (env, backend down, CORS)
2. **P1** — blocks a whole role (auth broken for admin)
3. **P2** — specific CRUD endpoints broken
4. **P3** — error UX only (API works, UI mishandles response)

Recommend which phase prompt to run next based on categories found.

## Do NOT

- Start fixing code in this phase
- Assume one root cause for all errors — auth vs contract vs network often coexist
- Skip marketing/public endpoints if those also fail
