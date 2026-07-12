<!-- Insert into QA_TESTING_GUIDE.md after section 2.11, before "## 3. Admin dashboard" -->

## 2A. Offline booking mode

See also: `docs/testing/offline-booking-qa.md`

Launch-preview flow when online checkout is disabled. Requires restarting **both** backend and frontend after changing flags.

### Environment

| Layer | Variable | Value |
| ----- | -------- | ----- |
| Backend | `FEATURE_ONLINE_BOOKING` | `false` in `backend/.env` |
| Frontend | `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING` | `false` in `frontend/.env` |

**Restart:** `uvicorn` + `pnpm dev`. Playwright: `pnpm test:e2e --project=offline-booking`.

### 2A.1 Guest browse — Book by phone or WhatsApp

| Field | Value |
| ----- | ----- |
| **Login** | None or `customer@demo.dlm` / `Customer@1234` |
| **Path** | `/discover` → Quick Wash Koramangala |

**Validation:** **Book by phone or WhatsApp** banner; browse-only price list (no checkout); Call/WhatsApp without login; `/checkout/[id]` redirects to detail with banner.

### 2A.2 Partner walk-in order entry

| Field | Value |
| ----- | ----- |
| **Login** | `partner.koramangala@demo.dlm` / `Partner@1234` |
| **Path** | `/partner/walk-in-orders` |

**Validation:** Walk-in order created with `DLM…` tracking code and GST totals.

### 2A.3 Walk-in status → WhatsApp notification

Advance **confirmed → washing → ready → delivered** (walk-in skips pickup/ironing). Expect stub log or Twilio sandbox message on `confirmed`, `washing`, `ready`, `delivered`.

**Automated:** `backend/tests/api/test_walk_in_orders.py`, `frontend/tests/e2e/offline-booking.spec.ts`
