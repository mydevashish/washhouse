# Bug Tracker

> Critical / production bugs go here. Trivial UI nits → linear/jira/github issues.

## Severity

| Sev | Meaning                                       | SLA              |
| --- | --------------------------------------------- | ---------------- |
| S0  | Production down / data loss / security breach | < 1 hour         |
| S1  | Major feature broken                          | < 24 hours       |
| S2  | Partial breakage, workaround exists           | < 1 week         |
| S3  | Minor / cosmetic                              | Next sprint      |

## Diagnostic run — 2026-07-29 (local) — stores/discover · `GET /api/v1/laundries`

**Environment:** local  
**Failing roles reported:** public / customer (stores + discover)  
**Prompt:** `.cursor/prompts/diagnose-api-errors.md` → classify A–H → matching fix

### Infrastructure snapshot

| Check | Result |
| ----- | ------ |
| `GET /api/v1/health` | **200** `{"status":"ok","service":"dlm-backend","version":"0.1.0"}` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` |
| Backend `PORT` | `8000` (match) |
| `CORS_ALLOW_ORIGINS` | `http://localhost:3000,http://localhost:3002` — ACAO echo OK for `:3002` |
| `alembic current` | `20260729_0036 (head)` |
| Redis / `CACHE_ENABLED` | Redis down / `CACHE_ENABLED=false` |
| Frontend `:3000` / `:3002` | Both serving `/stores` + `/discover` 200 |

### Endpoint inventory (evidence)

| # | Page route | HTTP | Method | Endpoint | Status | error.code | Category | Notes |
| - | ---------- | ---- | ------ | -------- | ------ | ---------- | -------- | ----- |
| 1 | `/stores`, `/discover` | GET | GET | `/api/v1/laundries` | **200** | — | **none (live green)** | `X-Request-ID=req_6c0efa1da4e14e0bbbbc1734`; body `{data:[…14], meta}`; no `error` field |
| 2 | browser `/discover` | — | GET | `/api/v1/laundries` | 200 (UI) | — | — | UI: “14 laundries nearby” + partner cards |
| 3 | browser `/stores` | — | GET | `/api/v1/laundries` | 200 (UI) | — | — | DOM: 14 “View store” links (Sparkle Clean, QuickWash, …); no “Could not load stores” |

### Backend traceback

- **No request-handler traceback for `GET /laundries`.**
- Only WatchFiles reload noise (`asyncio.CancelledError` / `KeyboardInterrupt` during `laundry_service.py` reload) — not a 500 response to clients.
- Live responses remained **200** throughout verification.

### Classification & fix-phase decision

| Prior (same day) | Category | Fix prompt applied |
| ---------------- | -------- | ------------------ |
| BUG-2026-07-29-001 (API down) | **A** | `fix-api-connectivity-env.md` — resolved (uvicorn up + CORS `:3002`) |
| BUG-2026-07-29-002 (empty list / sticky cache risk) | **H** (+ data/seed) | `fix-api-frontend-contracts.md` + service/seed harden — resolved in working tree |

**This re-run:** no live A–H failure on `GET /api/v1/laundries`. No new fix phase started. Category H unit tests `tests/unit/test_laundry_list_public_cache.py` → **2 passed**.

### Prioritized summary

1. **P0** — none live (API reachable, CORS OK)
2. **P1** — none
3. **P2** — none for this endpoint
4. **P3** — none

**Next:** none required for laundries list; keep prior H hardenings (`list_public` skip empty cache + demo re-approve) when committing.

---

## Diagnostic run — 2026-07-14 (local)

**Environment:** local  
**Failing roles reported:** customer, partner, admin (all)  
**Pages swept:** `/discover`, `/orders`, `/partner`, `/admin` (+ sub-routes via curl/TestClient)

### Infrastructure snapshot

| Check | Result |
| ----- | ------ |
| Frontend `http://localhost:3000` | 200 OK |
| Backend `http://localhost:8000/api/v1/health` (initial) | **Connection refused** — uvicorn not listening |
| `NEXT_PUBLIC_API_URL` (frontend `.env.local`) | `http://localhost:8000/api/v1` |
| `PORT` (backend `.env`) | `8000` — **aligned** |
| Alembic `current` | `20260703_0031` |
| Alembic `head` | `20260713_0032` — **pending** |
| `AUTO_RUN_MIGRATIONS` | `true` (default startup path) |

**Root finding:** Default backend startup aborts during pending migration `20260713_0032` (`DuplicateObjectError: type "marketing_contact_subject" already exists`). With `AUTO_RUN_MIGRATIONS=false`, API serves traffic; customer/partner core flows return 200.

---

## Pre-flight — 2026-07-28 (local, before role testing)

**Agents:** devops-engineer + qa-engineer  
**Prompts:** `fix-api-connectivity-env.md`, `pre-flight.md`

### Infrastructure snapshot

| Check | Result |
| ----- | ------ |
| Backend `GET /api/v1/health` | **200** `{"status":"ok","service":"dlm-backend","version":"0.1.0"}` |
| `GET /api/v1/health/db` | **404** — endpoint not implemented |
| `GET /api/v1/health/redis` | **404** — endpoint not implemented |
| `POST /api/v1/auth/login` (admin@yopmail.com) | **200** — access_token + role=admin |
| CORS preflight `OPTIONS /auth/login` Origin `http://localhost:3000` | **200** ACAO=`http://localhost:3000` |
| Alembic `current` / `heads` | `20260717_0034` (head) — **aligned** |
| Postgres `:5432` | up |
| Redis `:6379` | **down** (OK locally: `RATE_LIMIT_ENABLED=false`, `CACHE_ENABLED=false`) |
| Docker | **not installed** / not on PATH |
| Staging `https://washhouse.onrender.com/api/v1/health` | **timeout** |
| `NEXT_PUBLIC_API_URL` (`.env.local`) | `http://localhost:8000/api/v1` — **fixed this run** |
| `frontend/.env` (fallback) | still `https://washhouse.onrender.com/api/v1` (overridden by `.env.local`) |

### Suite results

| Suite | Result |
| ----- | ------ |
| `cd backend && pytest -q --tb=line` | **32 passed, 84 errors** — `InvalidPasswordError` for user `dlm` against `dlm_test` |
| `frontend` lint (`npm run lint`) | **pass** |
| `frontend` type-check | **fail** — 3× `TS2540` assign to `NODE_ENV` in `lib/online-booking.test.ts` |
| `frontend` jest | **126 passed, 2 failed** (see open bugs) |
| `playwright` smoke (`smoke.spec.ts` chromium-desktop) | **2/2 pass** (home + discover) |

**P0 fixed this run:** started uvicorn; set `frontend/.env.local` `NEXT_PUBLIC_API_URL` (+ `APP_URL`) to local backend. Login + health unblocked for local role testing.

---

## Open

### BUG-2026-07-29-002 — Public laundries empty (`data: []`) / stores & discover empty UI

- **Status:** resolved (hardened; empty payload not reproduced on current local DB)
- **Priority:** P0
- **Severity:** S1
- **Area:** discovery / laundry list / cache / seed
- **Owner:** backend-architect + qa-engineer
- **Environment:** local (`NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`)
- **Category:** H (client empty after 200) / data / cache
- **Symptoms:** After connectivity restored, concern that `GET /api/v1/laundries` returns **200** with `data: []` and UI shows "Could not load" / "No laundries" / "No stores".
- **Investigation:**
  1. `list_public` → `list_approved` filters `LaundryStatus.approved` only (by design).
  2. DB: **14 approved**, 1 pending, 1 suspended — demo + QA seed present (`AUTO_SEED_DEMO=true`).
  3. Envelope: `{ data: LaundryListItem[], meta }` — matches `parseLaundryListPayload(data.data)` (array).
  4. Redis `:6379` **down**; `CACHE_ENABLED=false` — no `laundries:list:v3:*` stale empty cache active.
  5. Browser: `/stores` and `/discover` show partner cards (Sparkle Clean Indiranagar, Quick Wash, …); Network `GET /laundries` → 200 non-empty.
- **Root cause (latent failure modes, not live empty today):** (a) public list only surfaces **approved** rows — unapproved/missing seed ⇒ `[]`; (b) if `CACHE_ENABLED=true`, an empty list could be cached under `laundries:list:v3:*` and stick until TTL/invalidation; (c) `ensure_demo_data` previously skipped existing demo slugs even if status drifted off `approved`.
- **Fix:**
  1. `LaundryService.list_public` — do **not** Redis-cache empty list payloads.
  2. `seed_demo.ensure_demo_data` — re-approve / undelete demo slugs when drifted; invalidate discovery cache after create/repair.
  3. Unit: `tests/unit/test_laundry_list_public_cache.py`.
- **Verification:** `GET /api/v1/laundries` → 200, **14** items; `/stores` + `/discover` render non-empty lists; cache unit tests pass (local `dlm_test` + postgres URL override).
- **Refs:** BUG-2026-07-29-001 (connectivity precursor); `SEED_DATA_REPORT.md`; `DEMO_ACCOUNTS.md`

### BUG-2026-07-29-001 — Local API down; `/stores` & `/discover` cannot load laundries

- **Status:** resolved
- **Priority:** P0
- **Severity:** S1
- **Area:** local connectivity / devops
- **Owner:** devops-engineer
- **Environment:** local (`NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, frontend on `:3000` / `:3002`)
- **Category:** A (network — connection refused on `:8000`)
- **Symptoms:** Browser XHR to `http://localhost:8000/api/v1/laundries` failed (connection refused). Port 8000 not listening; Postgres `:5432` up; Redis `:6379` down (OK — `RATE_LIMIT_ENABLED=false`, `CACHE_ENABLED=false`).
- **Root cause:** FastAPI/uvicorn was not running. Secondary: `CORS_ALLOW_ORIGINS` listed only `http://localhost:3000` while Next sometimes serves on `:3002`.
- **Fix:**
  1. Started API via `backend/scripts/run_dev.ps1` (venv `dlm_env`).
  2. Startup auto-migrated `20260717_0034` → `20260729_0036` successfully (`AUTO_RUN_MIGRATIONS=true` kept).
  3. Set `CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:3002` in `backend/.env` (no BOM); restarted uvicorn so settings reloaded.
- **Verification:**
  - `GET /api/v1/health` → **200**
  - `GET /api/v1/laundries` → **200** (14 items)
  - CORS ACAO for Origins `:3000` and `:3002` → matching origin
  - Browser `http://localhost:3002/stores` renders laundry list (Sparkle Clean Indiranagar, QuickWash, …) — not a network error
- **Refs:** `.cursor/prompts/fix-api-connectivity-env.md`

### BUG-2026-07-28-SEC-001 — `invoice_number` never assigned on order create

- **Status:** open
- **Priority:** P2
- **Severity:** S2 (Medium security/compliance)
- **Area:** orders / GST invoicing
- **Owner:** backend-architect
- **Description:** Order model has `invoice_number` (unique); create paths set `gst_rate` / `cgst_inr` / `sgst_inr` but never allocate an invoice number. Blocks India GST invoice issuance.
- **Remediation:** Allocate sequential/unique invoice numbers at create (and walk-in); expose on order response; add regression test.

### BUG-2026-07-28-SEC-002 — `.env.example` CORS is localhost-only (no prod guidance)

- **Status:** open
- **Priority:** P2
- **Severity:** S3 (Medium ops/security)
- **Area:** CORS / deployment
- **Owner:** devops-engineer
- **Description:** `CORS_ALLOW_ORIGINS=http://localhost:3000` only. Prod misconfig risk if operators copy example blindly (wrong origin or accidental widen).
- **Remediation:** Document prod comma-separated allow-list in `.env.example` comments + Railway/Render env docs; never use `*`.

### BUG-2026-07-28-SEC-003 — Auth OTP rate window looser than security rules; no Retry-After

- **Status:** open
- **Priority:** P2
- **Severity:** S3 (Medium)
- **Area:** rate limiting
- **Owner:** backend-architect
- **Description:** Rules specify login 10/15min and OTP 5/hour; middleware uses 20/min auth prefix and 5/min OTP. 429 responses lack `Retry-After`.
- **Remediation:** Align `LIMITS` with `09-security.md`; attach `Retry-After` on `RateLimitError` responses.

### BUG-2026-07-28-020 — Walk-in create hung ~2min when Redis/Celery broker down

- **Status:** resolved
- **Priority:** P0
- **Severity:** S1
- **Area:** partner / walk-in orders
- **Owner:** backend-architect
- **Environment:** local (Redis :6379 down)
- **Repro:** `POST /partner/walk-in-orders` blocked on `send_order_status_whatsapp.delay()` until Celery broker connect gave up (~122s)
- **Fix:** Daemon-thread enqueue in `OrderStatusWhatsAppNotifier.schedule`; Celery `broker_connection_timeout=2` + redis transport socket timeouts
- **Verification:** create ~5s without Redis; Playwright partner journey test 6 green

### BUG-2026-07-28-021 — Partner saw full Admin shell on `/admin` (RoleGuard page-only)

- **Status:** resolved
- **Priority:** P0
- **Severity:** S1
- **Area:** authz / admin + partner layouts
- **Owner:** frontend-architect
- **Environment:** local
- **Repro:** Login as `partner.koramangala@demo.dlm` → `/admin` showed DLM Ops sidebar + Overview breadcrumb with only main pane “Access not allowed”
- **Fix:** Wrap `AdminShell` / `PartnerShell` in layout-level `RoleGuard` so denied roles never get portal chrome
- **Verification:** Playwright partner journey test 8 + customer `/partner` authz smoke

### BUG-2026-07-28-010 — Discover PartnersSection lacked search/filter/sort (orphaned LaundryListing)

- **Status:** resolved
- **Priority:** P1
- **Severity:** S2
- **Area:** customer / discovery
- **Owner:** frontend-architect
- **Environment:** local
- **Repro:** `/discover#partners` showed cards only — no search/filter/sort UI despite shipped listing components
- **Fix (2026-07-28):** Wired `useLaundryDiscovery` + `LaundryFiltersBar` + search into `PartnersSection`
- **Verification:** Playwright customer-journey step 2; browser shows Filters search region

### BUG-2026-07-28-011 — Customer cancel order missing (API + FE)

- **Status:** resolved
- **Priority:** P1
- **Severity:** S2
- **Area:** customer / orders
- **Owner:** backend-architect + frontend-architect
- **Repro:** Spec requires cancel before `picked_up`; no `POST /orders/{id}/cancel` or UI
- **Fix:** `OrderService.cancel_order_customer` + endpoint; `cancelOrder` service + Cancel button on tracking (confirmed / pickup_assigned)
- **Verification:** API smoke create→cancel; Playwright step 6 twice

### BUG-2026-07-28-012 — Account address edit UI missing (PATCH API existed)

- **Status:** resolved
- **Priority:** P2
- **Severity:** S3
- **Area:** customer / account
- **Fix:** `updateAddress` FE client + Edit/Save on `/account`
- **Verification:** Playwright step 3 add/edit/delete

### BUG-2026-07-28-013 — `goToCheckout` no-op when env flag false but `/config` true

- **Status:** resolved
- **Priority:** P0
- **Severity:** S1
- **Area:** checkout
- **Repro:** UI showed Continue to checkout (runtime config) but navigate gated on `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING` → click did nothing
- **Fix:** `goToCheckout` no longer re-checks env; callers gate via `useOnlineBookingEnabled`. Local flags set `FEATURE_ONLINE_BOOKING=true` / `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true` for online journey QA
- **Verification:** Playwright checkout step; dual consecutive green runs

### BUG-2026-07-28-009 — Playwright default config dual webServer hangs on unhealthy :3000

- **Status:** open (workaround shipped)
- **Priority:** P2
- **Severity:** S3
- **Area:** qa / e2e infra
- **Owner:** qa-engineer
- **Environment:** local
- **Repro:**
  1. Port 3000 occupied by a hung/zombie Next process (TCP open, HTTP timeout)
  2. `npx playwright test` (default `playwright.config.ts`) waits on webServer URLs `:3000` + `:3001`
  3. Suite never starts (no “Running N tests” output for minutes)
- **Workaround:** `npx playwright test --config=playwright.auth.config.ts` or `playwright.customer.config.ts` (no webServer; expects FE already up)
- **Fix ideas:** Health-check timeout on webServer; single primary server for non-offline projects; fail fast if URL TCP-open but HTTP dead

---

### BUG-2026-07-28-001 — Local FE pointed at Render API (missing `/api/v1` local override)

- **Status:** resolved
- **Priority:** P0
- **Severity:** S1
- **Area:** devops / env
- **Owner:** devops-engineer
- **Environment:** local
- **Category:** A — env / network
- **Repro:**
  1. `frontend/.env` has `NEXT_PUBLIC_API_URL=https://washhouse.onrender.com/api/v1`
  2. `frontend/.env.local` had only support phone/email — no API URL override
  3. Local backend on `:8000` not used; Render health timed out → login/network errors
- **Fix:** Added to `frontend/.env.local`:
  - `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  - Started `uvicorn` on `:8000`; verified health 200 + login 200
- **Verification:** health 200; login admin@yopmail.com → 200; CORS ACAO localhost:3000

**Resolved at:** 2026-07-28

---

### BUG-2026-07-28-002 — pytest suite cannot auth to `dlm_test` (84 setup errors)

- **Status:** mitigated (local)
- **Priority:** P1
- **Severity:** S2
- **Area:** qa / backend test infra
- **Owner:** qa-engineer
- **Environment:** local
- **Repro:**
  1. Local Postgres running with app user password from `backend/.env` (not necessarily `dlm_dev_password`)
  2. `cd backend && pytest -q --tb=line`
  3. Observe: `asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "dlm"` on API/integration fixtures
- **Root cause:** `tests/conftest.py` hardcodes `postgresql+asyncpg://dlm:dlm_dev_password@localhost:5432/dlm_test`; local DB password / `dlm_test` DB may not match CI defaults. Live app health uses `backend/.env` and works.
- **Mitigation (2026-07-28 auth-session):** Override for local runs:
  - `$env:DATABASE_URL="postgresql+asyncpg://postgres:…@localhost:5432/dlm_test"`
  - `$env:DATABASE_URL_DIRECT="postgresql://postgres:…@localhost:5432/dlm_test"`
  - `tests/api/test_auth.py` → **14 passed** with `dlm_env` + postgres creds
- **Follow-up:** Align CI/local default URL with `.env` or document required `dlm` role + `dlm_test` DB in README
- **Defer:** does not block login/health for role testing. Fix: create `dlm_test` with matching password or export `DATABASE_URL` before pytest.

---

### BUG-2026-07-28-003 — Staging Render health timeout

- **Status:** open
- **Priority:** P1
- **Severity:** S1
- **Area:** devops / staging
- **Owner:** devops-engineer
- **Environment:** staging (`washhouse.onrender.com`)
- **Repro:** `Invoke-WebRequest https://washhouse.onrender.com/api/v1/health` → operation timed out (~15s+)
- **Notes:** Known Phase-6 blocker in `current-status.md`. Local stack healthy; staging not verified.

---

### BUG-2026-07-28-004 — `/health/db` and `/health/redis` not implemented (404)

- **Status:** open
- **Priority:** P2
- **Severity:** S3
- **Area:** backend / observability
- **Owner:** backend-architect
- **Environment:** local
- **Repro:** `GET /api/v1/health/db` and `/api/v1/health/redis` → 404. Only liveness `GET /api/v1/health` exists.
- **Defer:** not required for login; needed for post-deploy checklist.

---

### BUG-2026-07-28-005 — Redis not running locally

- **Status:** open
- **Priority:** P2
- **Severity:** S3
- **Area:** devops
- **Owner:** devops-engineer
- **Environment:** local
- **Repro:** `Test-NetConnection localhost -Port 6379` → False; Docker CLI unavailable
- **Mitigation in effect:** `RATE_LIMIT_ENABLED=false`, `CACHE_ENABLED=false` in `backend/.env` — login not blocked
- **Defer:** start Redis before enabling rate-limit/cache

---

### BUG-2026-07-28-006 — `tsc --noEmit` fails on test file `NODE_ENV` assigns

- **Status:** open
- **Priority:** P2
- **Severity:** S3
- **Area:** frontend / types
- **Owner:** frontend-architect
- **Environment:** local
- **Repro:** `cd frontend && npm run type-check` → `TS2540` at `lib/online-booking.test.ts` lines 63, 68, 83 (`Cannot assign to 'NODE_ENV'`)
- **Defer:** feature/test typing; does not block login

---

### BUG-2026-07-28-007 — Jest: home-hero phoneImage + formatFromRupee regressions

- **Status:** open
- **Priority:** P2
- **Severity:** S3
- **Area:** frontend / marketing
- **Owner:** frontend-architect
- **Environment:** local
- **Repro:**
  1. `cd frontend && npm test`
  2. `features/marketing/home/home-hero.test.tsx` — `slide.phoneImage` undefined for delivery variant
  3. `features/marketing/pricing/lib/group-from-categories.test.ts` — expected `"from ₹69"`, got `"₹69"`
- **Defer:** feature bugs; smoke e2e still green

---

### BUG-2026-07-28-008 — `pnpm run *` blocked by `ERR_PNPM_IGNORED_BUILDS`

- **Status:** open
- **Priority:** P2
- **Severity:** S3
- **Area:** devops / frontend tooling
- **Owner:** devops-engineer
- **Environment:** local (Windows)
- **Repro:** `pnpm` not on PATH initially; after `npm i -g pnpm`, `pnpm run lint` fails with ignored builds for `msw`, `sharp`, `unrs-resolver`. Repo uses `package-lock.json` (npm).
- **Workaround:** use `npm run lint|type-check|test` — verified this run

---

### BUG-2026-07-27-001 — Login navbar showed “DLM”; book-now dialog layout issues

- **Status:** resolved
- **Priority:** P2
- **Severity:** S3
- **Area:** frontend / marketing book-now + auth login
- **Environment:** local
- **Repro:**
  - `/?book=1` — form appeared pushed right; preferred-time label truncated; notes hint overlapping
  - `/login?audience=partner` / `?audience=admin` — navbar H1 showed “DLM”
- **Root cause:**
  - `DialogContent` used CSS `grid` with an absolutely positioned Close, which could create an empty track and mis-align children; book dialog was also `sm:max-w-md` (tight for long select labels)
  - `/login` missing from `getCustomerPageTitle`; `PublicShell` always derived title from pathname only
- **Fix:**
  - Dialog → `flex flex-col`; book dialog wider; form fields full-width; notes hint below textarea with gap
  - `PublicShell` accepts `pageTitle`; login passes audience title via `getLoginPageTitle`; fallback “WashHouse” instead of “DLM”
  - Larger auth `WashhouseLogo` (`adaptive={false}`); franchise PDF still placeholder — README documents blocker
- **Verification:** unit tests for audience + customer titles; Playwright staff login title + book-now layout assertions

**Resolved at:** 2026-07-27

---

### BUG-2026-07-17-003 — Outbound email never sent (contact / franchise / forgot-password)

- **Status:** resolved
- **Priority:** P1
- **Severity:** SEV2
- **Area:** backend / SMTP / marketing + auth
- **Environment:** local (`SMTP_*` mostly unset; only `SMTP_FROM_EMAIL` set)
- **Category:** missing sender + config (C) — not opaque 500s; silent no-op
- **Repro (2026-07-17):**
  - `POST /api/v1/marketing/contact` → **201** `{status:"received"}` — lead persisted; **no email module existed**
  - `POST /api/v1/auth/password/forgot` → **200** “reset code was sent” — OTP stored; **never emailed**
  - Announcement `channel_email` → log-only stub
  - Env check (no secrets): `SMTP_HOST/PORT/USERNAME/PASSWORD=UNSET`, `SMTP_FROM_EMAIL=SET`
- **Root cause:** SMTP settings existed in config/`.env.example` but there was no `EmailService` / `aiosmtplib` (or Resend) wiring. Marketing only wrote DB; forgot-password never called a mailer.
- **Fix:**
  - Added `EmailService` (`aiosmtplib`) with `EMAIL_NOT_CONFIGURED` (503) / `EMAIL_DELIVERY_FAILED` (502)
  - Config: empty `SMTP_PORT` → None; TLS/SSL by port (465 SSL / 587 STARTTLS); `SUPPORT_EMAIL`; username requires password
  - Contact/franchise: DB persist + best-effort support notify
  - Forgot-password: send reset code when SMTP set; clear 503 when SMTP unset and `OTP_DEBUG=false`
  - Docs: `.env.example`, `docs/runbooks/email-smtp.md`; unit tests for missing SMTP + mocked send
- **Verification:** unit `tests/unit/test_email_service.py` 8 passed; contact still **201** with SMTP unset (lead saved + warning log); with valid SMTP, mail sends to `SUPPORT_EMAIL` / user inbox.

**Resolved at:** 2026-07-17

---

### BUG-2026-07-17-002 — Home “Our Laundry Services” mobile carousel does not scroll

- **Status:** resolved
- **Priority:** P1
- **Severity:** SEV2
- **Area:** marketing homepage / services preview
- **Environment:** local (`http://localhost:3000`, mobile ≤768 / 390×844)
- **Category:** frontend CSS (touch-action)
- **Repro:** Open `/` at ≤768px → “Our Laundry Services” → swipe/scroll cards horizontally → stuck.
- **Root cause:** Strip used `HORIZONTAL_SCROLL_TOUCH_CLASS` (`.horizontal-scroll-touch` → `touch-action: pan-y`), which is correct for Embla JS drag but **blocks native** `overflow-x-auto` horizontal pan. Geometry was fine (`scrollWidth` ≫ `clientWidth`); parent `overflow-x-hidden` was not the blocker.
- **Fix:** Introduced `HORIZONTAL_SCROLL_NATIVE_CLASS` (`touch-action: manipulation`) for CSS scroll strips; services preview uses it. Embla keeps `HORIZONTAL_SCROLL_TOUCH_CLASS`. Updated e2e + `19-responsive-design.md`.
- **Verification:** Playwright chromium + mobile-chrome — scrollWidth overflow + scrollLeft advances + vertical wheel still works; browser CDP at 390×844 confirms `touch-action: manipulation`. Manual: swipe horizontal on strip, then vertical page scroll at 390×844; tablet (≥md) still shows 2-col grid.

**Resolved at:** 2026-07-17

---

### BUG-2026-07-17-001 — Contact & Franchise forms show network error on submit

- **Status:** resolved
- **Priority:** P1
- **Severity:** SEV2
- **Area:** marketing / public forms
- **Environment:** local (`frontend/.env.local` → `localhost:8000/api/v1`)
- **Category:** A — Network (backend down) + P3 error UX (bare axios “Network Error”)
- **Root cause:** uvicorn not listening; FE env/CORS/path/schema already matched. Migrations already at head (`20260714_0033` includes marketing tables).
- **Fix:** Restart backend; improve `getApiErrorMessage` + marketing submit error helper so unreachable API shows actionable copy (email support) instead of “Network Error”; validation/rate-limit messages preserved.
- **Verification:** `POST /api/v1/marketing/contact` + `/franchise-inquiries` → 201; browser Contact form reset after success; GET stats/testimonials OK; Home/Services/Stores/Franchise/Contact/Pricing → 200.

**Resolved at:** 2026-07-17

---

### BUG-2026-07-14-004 — Guest Call / WhatsApp missing on discover & storefront (online booking mode)

- **Status:** resolved
- **Priority:** P1
- **Severity:** SEV2
- **Area:** customer experience / offline-booking flags
- **Environment:** local (`frontend/.env.local` → `localhost:8000`)
- **Category:** config (A) + frontend contract (D)
- **Fix:** Set `FEATURE_ONLINE_BOOKING=false` and `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=false` in `backend/.env`, `frontend/.env`, and `frontend/.env.local`; ran `ensure_demo_storefronts()`; restarted API + `pnpm dev`.

**Resolved at:** 2026-07-14

**Verification:** `GET /api/v1/config` → `online_booking_enabled:false`; guest contact → `requires_login:false`, `show_call:true`, `phone:"+91 98765 43210"`; `/discover/[id]` shows offline banner + Call/WhatsApp buttons without login.

---

### BUG-2026-07-14-001 — Backend will not start with default `AUTO_RUN_MIGRATIONS=true`

- **Status:** resolved
- **Priority:** P0
- **Severity:** SEV1
- **Area:** infrastructure / migrations
- **Environment:** local
- **Category:** server (root) → **network** (symptom: no HTTP response)
- **Fix phase:** backend migration repair (`15-database-migrations`) then `fix-api-connectivity-env.md`
- **Resolved at:** 2026-07-15

**Summary:** Uvicorn never binds to port 8000 on normal dev startup because auto-migration crashes mid-upgrade.

**Symptoms:** All roles see axios `response === undefined`, browser Network shows XHR to `localhost:8000` with no status, console `connectivity.failed`. `/discover` stuck on "Loading laundries…".

**Evidence:**

| Page route | Method | Endpoint | Status | error.code | Category |
| ---------- | ------ | -------- | ------ | ---------- | -------- |
| `/discover` | GET | `/api/v1/health` | — (no response) | `NETWORK_ERROR` | network |
| `/discover` | GET | `/api/v1/laundries` | — | `NETWORK_ERROR` | network |
| `/discover` | GET | `/api/v1/marketing/testimonials?limit=6` | — | `NETWORK_ERROR` | network |
| `/orders` | GET | `/api/v1/orders` | — | `NETWORK_ERROR` | network |
| `/partner` | GET | `/api/v1/partner/analytics/summary` | — | `NETWORK_ERROR` | network |
| `/admin` | GET | `/api/v1/admin/dashboard` | — | `NETWORK_ERROR` | network |

**Repro:**

1. Ensure backend is not running (`Test-NetConnection localhost -Port 8000` → False).
2. Run `backend/scripts/run_dev.ps1` (or `uvicorn app.main:app --port 8000`).
3. Observe migration log: `Running upgrade 20260703_0031 -> 20260713_0032` then `DuplicateObjectError: type "marketing_contact_subject" already exists`.
4. Open `/discover` — all API calls fail.

**Root cause:** Partial migration state — enum `marketing_contact_subject` exists in DB but Alembic revision still at `20260703_0031`. Migration `20260713_0032` uses bare `CREATE TYPE` without `IF NOT EXISTS`.

**Hypothesis / fix plan:** Stamp or repair migration state; make enum creation idempotent; run `alembic upgrade head`; verify health 200 on default startup.

**Resolution:** Migration `20260713_0032` made idempotent; `alembic upgrade head` → `20260714_0033 (head)`. Backend starts with `AUTO_RUN_MIGRATIONS=true`; `GET /api/v1/health` → 200; `GET /api/v1/laundries` → 200 (3 items). Env parity confirmed (`PORT=8000`, `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, `CORS_ALLOW_ORIGINS=http://localhost:3000`).

---

### BUG-2026-07-14-002 — Admin paginated list APIs return 500

- **Status:** resolved
- **Priority:** P2
- **Severity:** SEV2
- **Area:** admin
- **Environment:** local (reproduced with API up + `AUTO_RUN_MIGRATIONS=false`)
- **Category:** server
- **Fix phase:** backend service fix (admin list query params)
- **Resolved at:** 2026-07-15

**Summary:** Admin orders, customers, and audit log tables cannot load — list endpoints crash before DB query completes.

**Evidence (admin@yopmail.com, Bearer token):**

| Page route | Method | Endpoint | Status | error.code | Category |
| ---------- | ------ | -------- | ------ | ---------- | -------- |
| `/admin/orders` | GET | `/api/v1/admin/orders?page=1&page_size=20` | 500 | `INTERNAL_ERROR` | server |
| `/admin/customers` | GET | `/api/v1/admin/users?page=1&page_size=20` | 500 | `INTERNAL_ERROR` | server |
| `/admin/audit` | GET | `/api/v1/admin/audit-logs?page=1&page_size=20` | 500 | `INTERNAL_ERROR` | server |

**Repro:** Log in as admin → open `/admin/orders` (or curl with admin token + query params above).

**Root cause:** `backend/app/api/admin_list_params.py` and `trust_score_list_params.py` — filter subclasses extended frozen `ListQueryParams` without `@dataclass`, so extra kwargs (`status`, `role`, `resource_type`) were passed to the parent `__init__`.

**Resolution:** Added `@dataclass(frozen=True)` to `AdminUserListParams`, `AdminOrderListParams`, `AdminAuditListParams`, and `TrustScoreListParams`. Regression tests in `tests/unit/test_list_query_params.py`.

**Verification (2026-07-15):** `GET /admin/orders`, `/admin/users`, `/admin/audit-logs`, `/admin/trust-scores` → 200 with `{ items, page, page_size, total_records, ... }` envelope matching `frontend/lib/pagination/types.ts`.

---

### BUG-2026-07-14-003 — Documented QA admin account cannot log in

- **Status:** resolved
- **Priority:** P1 (blocks QA/admin testing with documented credentials)
- **Severity:** SEV2
- **Area:** auth / seed data
- **Environment:** local
- **Category:** auth
- **Fix phase:** run `backend/scripts/seed_qa.py` or `fix-api-auth-session.md` (seed alignment)
- **Resolved at:** 2026-07-15

**Summary:** `admin@demo.dlm` / `Admin@1234` (per `DEMO_ACCOUNTS.md`) returns 401; only auto-seed `admin@yopmail.com` works.

**Resolution:** Ran `python backend/scripts/seed_qa.py` — `admin@demo.dlm` login → 200; `GET /users/me` role=admin. Frontend auth hardened: axios 401→refresh retry, RoleGuard expired-token recovery, admin `OptionalAuthRefresh` + query gating.

**Evidence:**

| Page route | Method | Endpoint | Status | error.code | Category |
| ---------- | ------ | -------- | ------ | ---------- | -------- |
| `/login` (admin audience) | POST | `/api/v1/auth/login` | 401 | `AUTH_INVALID_CREDENTIALS` | auth |

**Repro:** POST `{"email":"admin@demo.dlm","password":"Admin@1234"}` → 401. Compare with `admin@yopmail.com` → 200.

**Root cause:** QA seed (`seed_qa.py`) not applied; `AUTO_SEED_DEMO=true` did not create `admin@demo.dlm` in this database.

---

### BUG-2026-07-15-001 — Partner orders 500 when owner has multiple laundries

- **Status:** resolved
- **Priority:** P2
- **Severity:** SEV2
- **Area:** partner
- **Environment:** local (after `seed_qa.py`)
- **Category:** server
- **Resolved at:** 2026-07-15

**Summary:** `GET /partner/orders` returned 500 for `partner.koramangala@demo.dlm` because QA seed assigns multiple laundries to one partner; `LaundryRepository.get_by_owner()` used `scalar_one_or_none()`.

**Resolution:** `get_by_owner()` returns oldest laundry via `limit(1)`; added `list_by_owner()`; `PartnerService.list_orders_for_partner` and `list_customers` aggregate across all partner laundry IDs.

**Verification:** `GET /partner/orders` → 200, 50 orders returned.

---

## Priority summary

| Priority | Bug ID | Impact | Category | Next prompt |
| -------- | ------ | ------ | -------- | ----------- |
| ~~**P0**~~ | ~~BUG-2026-07-14-001~~ | ~~Blocks **all** API traffic when backend started normally~~ | ~~network / server~~ | **Resolved 2026-07-15** |
| ~~**P1**~~ | ~~BUG-2026-07-14-003~~ | ~~Blocks admin QA with documented credentials~~ | ~~auth~~ | **Resolved 2026-07-15** (seed_qa + FE auth fixes) |
| ~~**P2**~~ | ~~BUG-2026-07-14-002~~ | ~~Admin orders/customers/audit CRUD views broken~~ | ~~server~~ | **Resolved 2026-07-15** (`@dataclass` list param subclasses) |

### Verified OK when API is running (no new bugs filed)

| Role | Page | Endpoint | Status |
| ---- | ---- | -------- | ------ |
| public | `/discover` | `GET /laundries` | 200 |
| public | `/discover` | `GET /marketing/testimonials?limit=6` | 200 |
| customer | `/orders` | `GET /orders` | 200 |
| customer | `/account` | `GET /users/me`, `GET /users/me/addresses` | 200 |
| partner | `/partner` | `GET /partner/analytics/summary` | 200 |
| partner | `/partner/orders` | `GET /partner/orders` | 200 (multi-laundry QA seed; see BUG-2026-07-15-001) |
| partner | `/partner/operations` | `GET /partner/operations/dashboard` | 200 |
| admin | `/admin` | `GET /admin/dashboard`, `GET /admin/analytics` | 200 |
| admin | `/admin/revenue/analytics` | `GET /admin/revenue-analytics/dashboard?period=last_30_days` | 200 |

**Contract mismatches:** None confirmed on swept routes when API is reachable. Revenue analytics FE already sends `period=last_30_days` (valid enum).

---

## Resolved

### BUG-001 — Forgot / reset password UI missing

- **Severity:** S1 (launch gate / High)
- **Reported by:** production-readiness / QA audit
- **Reported at:** 2026-06 (BUG_LIST) / reconfirmed 2026-07-28
- **Environment:** all
- **Symptoms:** No `/forgot-password` or `/reset-password` pages; login had no recovery link. Backend `POST /auth/password/forgot` + `/reset` already existed.
- **Root cause:** Frontend never built for password recovery.
- **Fix:** MarketingShell pages + RHF/Zod forms; `forgotPassword` / `resetPassword` in `services/auth.ts`; login “Forgot password?” (preserves `audience`); generic success copy; Playwright smoke + schema unit tests.
- **Resolved at:** 2026-07-29
- **Postmortem:** n/a (feature gap, not prod incident)

### BUG-2026-07-14-004 — Guest Call / WhatsApp missing (online booking mode)

- **Severity:** SEV2
- **Fix:** Offline booking flags set to `false` in `backend/.env`, `frontend/.env`, `frontend/.env.local`; demo storefronts re-seeded; servers restarted.
- **Resolved at:** 2026-07-14

### BUG-2026-07-13-002 — /discover shows "0 laundries nearby" when API has data

- **Severity:** SEV2
- **Reported by:** user
- **Reported at:** 2026-07-13
- **Environment:** local
- **Symptoms:** Filters bar showed `0 laundries nearby` while `/laundries` returned items — either during fetch (loading gap) or after `applyClientFilters` removed every row when filter caps were invalid zeros.
- **Repro:** Open `/discover`; with zeroed `maxDistance` / `maxPrice` / `maxDeliveryHours` caps, all enriched laundries were excluded despite API data.
- **Root cause:** `applyClientFilters` compared pseudo-fields with unnormalized caps (`Number('')` → 0), so any positive distance/price/delivery failed every check. Loading state also cleared before enriched rows existed, flashing `0 nearby`.
- **Fix:** Added `normalizeLaundryFilters` + sentinel-aware filtering; defensive `parseLaundryListPayload`; improved `isLoading` in `useLaundryDiscovery`; unit + Playwright coverage.
- **Resolved at:** 2026-07-13
- **Postmortem:** n/a (SEV2)

### BUG-2026-07-13-001 — Hero sticky CTAs overlap carousel text on mobile

- **Severity:** SEV3
- **Reported by:** user
- **Reported at:** 2026-07-13
- **Environment:** local
- **Symptoms:** On mobile (~375px), absolutely positioned sticky CTAs (`data-marketing-sticky-cta`) cover carousel slide headline and subcopy inside `GlassSurface`.
- **Repro:** Open `/` at 375px viewport width.
- **Root cause:** Sticky CTAs were `absolute inset-x-0 bottom-0` over the carousel; slide bottom padding (`pb-24`) was insufficient for tall GlassSurface content on the first slide (brand badge + stats).
- **Fix:** Move mobile-only sticky CTAs below the carousel in normal document flow (`sm:hidden`); remove overlay padding from slides; reposition dot indicators to carousel bottom; per-slide CTAs remain on `sm+`.
- **Resolved at:** 2026-07-13
- **Postmortem:** n/a (SEV3)

## Entry template

```
### BUG-NNN — <title>
- **Severity:** S0 / S1 / S2 / S3
- **Reported by:** <user / monitor>
- **Reported at:** YYYY-MM-DD HH:MM
- **Environment:** prod / staging
- **Symptoms:** ...
- **Repro:** ...
- **Root cause:** ...
- **Fix:** <commit / PR>
- **Resolved at:** YYYY-MM-DD HH:MM
- **Postmortem:** <link> (if S0/S1)
```
