# Bug Tracker

> Critical / production bugs go here. Trivial UI nits → linear/jira/github issues.

## Severity

| Sev | Meaning                                       | SLA              |
| --- | --------------------------------------------- | ---------------- |
| S0  | Production down / data loss / security breach | < 1 hour         |
| S1  | Major feature broken                          | < 24 hours       |
| S2  | Partial breakage, workaround exists           | < 1 week         |
| S3  | Minor / cosmetic                              | Next sprint      |

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

## Open

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
