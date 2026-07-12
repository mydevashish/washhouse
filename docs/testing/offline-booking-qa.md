# Offline booking mode — manual QA

Companion to `QA_TESTING_GUIDE.md` §2A (merge there when the root guide is writable).

**Last updated:** 2026-07-03  
**Demo accounts:** `customer@demo.dlm` / `Customer@1234` · `partner.koramangala@demo.dlm` / `Partner@1234`

---

## Environment

| Layer | Variable | Value |
| ----- | -------- | ----- |
| Backend | `FEATURE_ONLINE_BOOKING` | `false` in `backend/.env` |
| Frontend | `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING` | `false` in `frontend/.env` |

**Restart** both `uvicorn` and `pnpm dev` after changing flags.

**Redis** (required for walk-in WhatsApp enqueue via Celery): `redis://localhost:6379` must be reachable. Without it, `POST /partner/walk-in-orders` may hang until the broker connection times out.

**Seed data** (if demo accounts missing): from `backend/` run `python scripts/seed.py` then `python -c "import asyncio; from app.db.seed_storefront import ensure_demo_storefronts; asyncio.run(ensure_demo_storefronts())"`.

**API sanity check (optional):**

```bash
curl http://localhost:8000/api/v1/config
# → data.online_booking_enabled: false

curl http://localhost:8000/api/v1/laundries/<laundry-id>/contact
# guest (no auth) → requires_login: false, show_call/show_whatsapp: true
```

**Automated E2E:** `pnpm test:e2e --project=offline-booking` (frontend on port 3001 with flag pre-set; requires API + seed).

---

## 2A.1 Guest browse — Book by phone or WhatsApp

| Field | Value |
| ----- | ----- |
| **Login** | None (guest) or `customer@demo.dlm` |
| **Path** | `/discover` → Quick Wash Koramangala (`/discover/[id]`) |
| **Expected** | Services browsable (prices visible, no checkout); call-to-book banner; Call / WhatsApp / Maps |

**Steps:**

1. Set both feature flags to `false` and restart servers.
2. Open `/discover` without signing in.
3. Open **Quick Wash Koramangala** (seed laundry for `partner.koramangala@demo.dlm`).
4. On the Services tab, confirm the sidebar shows the offline banner and contact card.
5. Confirm **Call shop** and **WhatsApp shop** work without signing in (no “Sign in to call” / “Sign in for WhatsApp”).
6. Optional: sign in as `customer@demo.dlm` — same contact buttons remain available; engagement is tracked when logged in.

**Validation:**

- Banner title: **Book by phone or WhatsApp** — body mentions browsing prices then contacting the shop
- Services show INR prices (browse-only; no Add service / checkout)
- Guest contact works **without login** (no “Sign in to call” / “Sign in for WhatsApp”)
- **Call shop** → `tel:` link (mock or sandbox number)
- **WhatsApp shop** → `wa.me` / Twilio sandbox URL
- `/checkout/[laundryId]` redirects to `/discover/[laundryId]` with banner

---

## 2A.2 Partner walk-in order entry

| Field | Value |
| ----- | ----- |
| **Login** | `partner.koramangala@demo.dlm` / `Partner@1234` |
| **Path** | `/partner/walk-in-orders` |
| **Expected** | New walk-in order with tracking code |

**Steps:**

1. Sign in as Koramangala partner.
2. Partner sidebar → **Walk-in orders**.
3. **New entry** → customer name, phone (`+919876543210`), **Wash & Fold** × 1 → **Save walk-in order**.

**Validation:**

- Status `confirmed`, tracking code `DLM…`, GST totals correct
- Visible under Partner → Orders (walk-in source)

---

## 2A.3 Walk-in status → WhatsApp

| Field | Value |
| ----- | ----- |
| **Login** | `partner.koramangala@demo.dlm` |
| **Path** | `/partner/walk-in-orders` or `/partner/orders` |

**Steps:**

1. Advance walk-in order: **confirmed → washing → ironing → ready → delivered**.
2. Check output:
   - **Stub:** logs `whatsapp.template_stub` / `order.whatsapp_notify_scheduled`
   - **Twilio sandbox:** join sandbox on +1 415 523 8886; message includes name, tracking code, laundry

**Validation:**

- No pickup evidence / OTP for walk-in transitions
- WhatsApp on: `confirmed`, `washing`, `ready`, `delivered` (not `ironing`)

**Tests:** `backend/tests/api/test_walk_in_orders.py` · `frontend/tests/e2e/offline-booking.spec.ts`
