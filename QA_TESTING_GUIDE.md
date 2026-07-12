# QA Testing Guide — DLM Platform

**Last updated:** 2026-06-03  
**Prerequisites:** Backend running, DB migrated, QA seed applied (`python backend/scripts/seed_qa.py`)  
**Accounts:** See `DEMO_ACCOUNTS.md`  
**Data gaps:** See `MISSING_TEST_DATA.md`

---

## How to use this guide

Each section lists:

1. **Login account** — who to sign in as  
2. **Navigation path** — clicks or URL  
3. **Expected result** — what should appear  
4. **Test steps** — ordered actions  
5. **Validation criteria** — pass/fail checks  

**Default passwords:** Admin `Admin@1234` · Partner `Partner@1234` · Customer `Customer@1234` · Bulk QA `Demo@1234`

---

## 0. Environment setup

| Step | Action | Validation |
| ---- | ------ | ---------- |
| 1 | Start Postgres + backend | `GET /health` returns 200 |
| 2 | Run `alembic upgrade head` | No migration errors |
| 3 | Run `python backend/scripts/seed_qa.py` | Console shows 2000 orders created |
| 4 | Start frontend (`npm run dev`) | App loads at configured URL |
| 5 | Run `python backend/scripts/qa_counts.py` | Counts match `TEST_DATA_AUDIT.md` |

---

## 1. Authentication

### 1.1 Email login (customer)

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm / Customer@1234 |
| **Path** | `/login` |
| **Expected** | Redirect to `/discover` or `/orders`; user menu shows name |

**Steps:**
1. Open `/login`
2. Enter email and password
3. Click Sign in

**Validation:**
- No error toast
- Session persists on refresh
- `/orders` loads customer orders (2000+ in system; customer has assigned subset)

---

### 1.2 Email login (partner)

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm / Partner@1234 |
| **Path** | `/login` |
| **Expected** | Redirect to `/partner` |

**Steps:** Same as 1.1 with partner credentials

**Validation:**
- Partner sidebar visible
- Overview shows laundry name "Quick Wash Koramangala"
- Trust score card present

---

### 1.3 Email login (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm / Admin@1234 |
| **Path** | `/login` |
| **Expected** | Redirect to `/admin` |

**Validation:**
- Admin sidebar with Operations, Finance, Approvals, Monitoring
- Dashboard KPI cards show non-zero counts

---

### 1.4 Phone OTP login

| Field | Value |
| ----- | ----- |
| **Login** | Any registered phone (dev) |
| **Path** | `/login` → Phone OTP tab |
| **Expected** | OTP sent; verify succeeds |

**Steps:**
1. Switch to Phone OTP tab
2. Enter phone e.g. `+919876543210`
3. Request OTP
4. In dev, read OTP from toast/network `otp_debug`
5. Enter OTP and verify

**Validation:**
- User logged in
- Works for existing phone on user record

---

### 1.5 Register new customer

| Field | Value |
| ----- | ----- |
| **Login** | None (public) |
| **Path** | `/register` |
| **Expected** | New account created; logged in |

**Steps:**
1. Open `/register`
2. Fill name, email (unique), password, phone
3. Submit

**Validation:**
- Redirect to app
- `/account` shows new profile
- Trust score defaults to 100

---

### 1.6 Logout

| Field | Value |
| ----- | ----- |
| **Login** | Any authenticated user |
| **Path** | User menu → Sign out |
| **Expected** | Session cleared; redirect to `/login` or `/` |

**Validation:**
- Protected routes redirect to login
- Refresh token invalidated

---

### 1.7 Forgot / reset password

| Field | Value |
| ----- | ----- |
| **Status** | ❌ No UI — API only |

**Validation:** Document as N/A for UI testing; use API docs if needed.

---

## 2. Customer marketplace

### 2.1 Landing page

| Field | Value |
| ----- | ----- |
| **Login** | None |
| **Path** | `/` |
| **Expected** | Marketing hero, CTA to discover |

**Validation:** Page loads without auth; links to `/discover` work

---

### 2.2 Discover laundries

| Field | Value |
| ----- | ----- |
| **Login** | None or customer@demo.dlm |
| **Path** | `/discover` |
| **Expected** | Grid/list of approved laundries (14+ approved) |

**Steps:**
1. Open `/discover`
2. Scroll list
3. Optional: filter by city if available

**Validation:**
- At least 14 laundries visible
- Each card shows name, rating, location
- Click opens detail page

---

### 2.3 Search laundries

| Field | Value |
| ----- | ----- |
| **Login** | None |
| **Path** | `/discover?q=Koramangala` |
| **Expected** | Filtered results |

**Validation:** Results include Quick Wash Koramangala

---

### 2.4 Laundry detail & storefront

| Field | Value |
| ----- | ----- |
| **Login** | None |
| **Path** | `/discover/[id]` (pick Quick Wash Koramangala) |
| **Expected** | Services, hours, reviews tab, storefront tab |

**Steps:**
1. Open laundry from discover
2. View Services tab
3. Switch to Storefront tab
4. Switch to Reviews tab

**Validation:**
- Services listed with prices
- Storefront content if published
- Reviews show seeded ratings (50 total across platform)

---

### 2.5 Checkout & place order

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm |
| **Path** | `/checkout/[laundryId]` |
| **Expected** | Order created; payment flow or COD |

**Steps:**
1. From laundry detail, click Book / Order
2. Select services
3. Choose address (Koramangala pre-seeded)
4. Select pickup slot
5. Confirm and pay (or COD)

**Validation:**
- Order appears in `/orders`
- Tracking code generated
- Payment status matches selection (paid / pending COD)

---

### 2.6 My orders

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm |
| **Path** | `/orders` |
| **Expected** | List of customer orders with status badges |

**Validation:**
- Multiple statuses visible (delivered, in progress, cancelled)
- Click row opens detail

---

### 2.7 Order tracking

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm |
| **Path** | `/orders/[id]` |
| **Expected** | Timeline, status, laundry info |

**Steps:**
1. Open a delivered order
2. Open an in-progress order

**Validation:**
- Status timeline shows events
- Delivered orders show completion date
- "Report issue" visible on delivered orders

---

### 2.8 File dispute (customer)

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm |
| **Path** | `/orders/[id]` → Report issue |
| **Expected** | Complaint created |

**Steps:**
1. Open delivered order without existing dispute
2. Click Report issue
3. Select type (damage, missing item, etc.)
4. Add description; upload photo if possible
5. Submit

**Validation:**
- Success message
- Appears in `/disputes`
- Admin sees in `/admin/disputes`

---

### 2.9 Dispute center (customer)

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm |
| **Path** | `/disputes` |
| **Expected** | List of customer's disputes |

**Validation:**
- Status badges (open, investigating, resolved)
- Detail view shows order link

---

### 2.10 Account & loyalty

| Field | Value |
| ----- | ----- |
| **Login** | customer@demo.dlm or vip@demo.dlm |
| **Path** | `/account` |
| **Expected** | Profile, addresses, loyalty section |

**Validation:**
- Profile fields editable
- Referral code displayed
- ⚠️ Loyalty points may stay 0 (known gap — see MISSING_TEST_DATA.md)

---

### 2.11 Become a partner (marketing)

| Field | Value |
| ----- | ----- |
| **Login** | None |
| **Path** | `/partners` |
| **Expected** | Partner signup marketing page |

**Validation:** Static content loads; CTA present

---

## 3. Admin dashboard

### 3.1 Admin overview

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Overview (`/admin`) |
| **Expected** | KPI cards: orders, revenue, laundries, complaints |

**Validation:**
- Non-zero order count (~2000)
- Revenue figure present
- Recent activity or charts render

---

### 3.2 Laundries management

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Laundries (`/admin/laundries`) |
| **Expected** | 16 laundries; filters by status |

**Steps:**
1. List all laundries
2. Filter pending (1 expected)
3. Filter suspended (1 expected)
4. Open laundry detail

**Validation:**
- Approved, pending, suspended states visible
- Trust score and fraud risk columns if shown

---

### 3.3 Create laundry

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Laundries → Create |
| **Expected** | New laundry linked to partner |

**Steps:**
1. Click Create
2. Select partner user
3. Fill name, address, services
4. Save

**Validation:**
- Appears in list
- Partner can see in their dashboard (if approved)

---

### 3.4 Customers

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Customers (`/admin/customers`) |
| **Expected** | 100+ customers |

**Steps:**
1. Search `highrisk@demo.dlm`
2. Search `vip@demo.dlm`
3. Search `blocked@demo.dlm`

**Validation:**
- Trust scores differ (38, 92, 0)
- Fraud risk levels visible where implemented

---

### 3.5 Orders (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Orders (`/admin/orders`) |
| **Expected** | 2000 orders; filterable by status |

**Steps:**
1. Filter Delivered → ~1152
2. Filter Cancelled → ~96
3. Open order detail

**Validation:**
- Payment status shown (paid, failed, refunded, pending)
- Customer and laundry names resolve

---

### 3.6 Revenue

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Revenue (`/admin/revenue`) |
| **Expected** | Revenue analytics from paid/delivered orders |

**Validation:**
- Charts/totals non-zero
- Date range filter works if present

---

### 3.7 Commission

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Commission (`/admin/commission`) |
| **Expected** | Platform commission settings |

**Validation:**
- Default rate displayed
- Per-laundry override editable if UI supports

---

### 3.8 Approval center

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Approval center (`/admin/approvals`) |
| **Expected** | Pending laundry(ies) |

**Steps:**
1. View pending list
2. Approve or reject one (use test pending laundry)

**Validation:**
- Badge count on nav updates
- Status changes in laundries list

---

### 3.9 Inventory changes

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Inventory changes (`/admin/inventory-changes`) |
| **Expected** | Change requests (may be empty for bulk seed) |

**Validation:**
- Page loads without 403
- Approve/reject works when requests exist (create via partner inventory flow)

---

### 3.10 Dispute center (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Disputes (`/admin/disputes`) |
| **Expected** | 20 disputes |

**Steps:**
1. Open open/investigating dispute
2. View evidence bundle (order, customer)
3. Change status or add resolution note

**Validation:**
- 20 complaints listed
- Status transitions work
- ⚠️ Photo evidence empty on seeded disputes

---

### 3.11 Trust scores (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Trust scores (`/admin/trust-scores`) |
| **Expected** | Customer + Partner tabs |

**Steps:**
1. Customer tab → search vip@demo.dlm (score ~92)
2. Customer tab → search highrisk@demo.dlm (score ~38)
3. Partner tab → view laundry trust levels

**Validation:**
- Scores 0–100 displayed
- Levels: Verified / Premium / Trusted / Under Review
- Event history if exposed

---

### 3.12 Fraud detection (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Fraud detection (`/admin/fraud`) |
| **Expected** | 3+ fraud alerts |

**Steps:**
1. View alert list
2. Open critical/high alert
3. Acknowledge or resolve

**Validation:**
- Risk summary cards show counts
- linked user/laundry opens correctly
- highrisk@demo.dlm and blocked@demo.dlm tied to customer alerts

---

### 3.13 Audit logs (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Audit logs (`/admin/audit`) |
| **Expected** | 100+ audit entries |

**Validation:**
- Timestamp, actor, action visible
- Filter/search if available

---

### 3.14 Notifications (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Notifications (`/admin/notifications`) |
| **Expected** | ⚠️ Stub — derived metrics, not full notification inbox |

**Validation:** Page loads; document as partial — real notifications in DB not surfaced here

---

### 3.15 Settings (admin)

| Field | Value |
| ----- | ----- |
| **Login** | admin@demo.dlm |
| **Path** | Admin → Settings (`/admin/settings`) |
| **Expected** | Platform settings form |

**Validation:**
- Settings load and save
- `qa_seed_version` marker visible if exposed

---

## 4. Partner dashboard

### 4.1 Partner overview

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Overview (`/partner`) |
| **Expected** | Analytics, trust score card, recent orders |

**Validation:**
- Order counts non-zero
- Trust score for Quick Wash Koramangala shown

---

### 4.2 Partner orders

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Orders (`/partner/orders`) |
| **Expected** | Orders for partner's laundries |

**Steps:**
1. Filter by status (confirmed, washing, delivered)
2. Accept a confirmed order if action available
3. Advance status on in-progress order

**Validation:**
- Only partner's orders shown
- Status update reflects on customer tracking

---

### 4.3 Pickup requests

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Pickup requests (`/partner/pickups`) |
| **Expected** | Orders awaiting pickup |

**Validation:**
- Subset of orders in pre-pickup statuses
- Pickup evidence upload action on eligible orders

---

### 4.4 Pickup evidence upload

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Order card on pickup flow |
| **Expected** | Photos uploaded to order |

**Steps:**
1. Find order in pickup assigned / confirmed
2. Upload 1+ photos
3. Save

**Validation:**
- Success toast
- Customer timeline updates
- ⚠️ Bulk seeded orders lack photos — use new order

---

### 4.5 Inventory record

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Order card → Record inventory |
| **Expected** | Item count recorded |

**Validation:**
- Inventory row created
- Admin inventory changes may show pending approval

---

### 4.6 Deliveries

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Deliveries (`/partner/deliveries`) |
| **Expected** | Out-for-delivery orders |

**Validation:**
- Delivery proof + OTP actions visible

---

### 4.7 Delivery proof & OTP

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Delivery order card |
| **Expected** | Order marked delivered after OTP |

**Steps:**
1. Upload delivery proof
2. Enter customer OTP (from order/API in dev)
3. Complete delivery

**Validation:**
- Status → delivered
- Customer sees completion

---

### 4.8 Partner customers

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Customers (`/partner/customers`) |
| **Expected** | Past customers who ordered from this laundry |

**Validation:**
- Names/emails from seeded orders appear

---

### 4.9 Storefront builder

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Storefront builder (`/partner/storefront`) |
| **Expected** | Edit hero, banners, publish |

**Steps:**
1. Edit headline or image
2. Save draft / publish
3. View on `/discover/[id]` storefront tab

**Validation:**
- Changes reflect on public page when published

---

### 4.10 Partner reviews

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Reviews (`/partner/reviews`) |
| **Expected** | Reviews for partner laundries |

**Validation:**
- Star ratings and text visible
- Matches public discover reviews

---

### 4.11 Staff management

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Staff (`/partner/staff`) |
| **Expected** | Staff list CRUD |

**Steps:**
1. Add staff member
2. Edit role
3. Remove (optional)

**Validation:**
- Staff persists after refresh

---

### 4.12 Pricing & revenue

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Pricing & revenue (`/partner/revenue`) |
| **Expected** | Revenue summary, service pricing |

**Validation:**
- Revenue non-zero from seeded delivered orders
- Service prices editable if UI allows

---

### 4.13 Partner reports

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Reports (`/partner/reports`) |
| **Expected** | Basic analytics |

**Validation:** Charts/tables render; ⚠️ export may be limited

---

### 4.14 Partner notifications

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Notifications |
| **Expected** | ⚠️ Stub data (Zustand seed) |

**Validation:** Document as not connected to backend notifications table

---

### 4.15 Partner audit logs

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Audit logs |
| **Expected** | Limited partner-scoped logs |

**Validation:** Page loads; may have fewer entries than admin audit

---

### 4.16 Partner settings

| Field | Value |
| ----- | ----- |
| **Login** | partner.koramangala@demo.dlm |
| **Path** | Partner → Settings |
| **Expected** | Laundry profile, hours, contact |

**Validation:**
- Save updates profile
- Changes visible on discover detail

---

## 5. Scenario-based testing

### 5.1 Personas

| Persona | Account | What to test |
| ------- | ------- | ------------ |
| New customer | Register fresh email | Empty orders, trust 100 |
| Returning customer | customer@demo.dlm | Order history, reorder |
| VIP customer | vip@demo.dlm | High trust score in admin |
| High risk | highrisk@demo.dlm | Fraud alerts, low trust |
| Blocked (simulated) | blocked@demo.dlm | Critical fraud, trust 0 |
| Partner | partner.koramangala@demo.dlm | Full partner flows |
| Multi-branch | partner.koramangala@demo.dlm | 2 laundries in settings/list |
| Inactive partner | Admin → suspended laundry's partner | Limited or no active orders |
| Admin | admin@demo.dlm | All admin modules |

---

### 5.2 Order status coverage

Use **Admin → Orders** filter or **Partner → Orders**:

| Status | Approx seed count | Test account |
| ------ | ----------------- | ------------ |
| Confirmed | 162 | Partner |
| Pickup assigned | 127 | Partner pickups |
| Picked up | 105 | Partner |
| Washing | 86 | Partner |
| Ironing | 75 | Partner |
| Ready | 92 | Partner |
| Out for delivery | 105 | Partner deliveries |
| Delivered | 1152 | Customer tracking |
| Cancelled | 96 | All roles read-only |

---

### 5.3 Payment scenarios

Filter admin orders by payment status:

| Status | Approx count | Notes |
| ------ | ------------ | ----- |
| Paid | 1369 | Successful |
| Pending | 289 | Awaiting payment |
| Pending COD | 264 | Cash on delivery |
| Failed | 48 | Failed payment |
| Refunded | 30 | Full refund |
| Partial refund | 0 | ❌ Not seeded |

---

### 5.4 Fraud scenarios

| Scenario | How to test | Account |
| -------- | ----------- | ------- |
| Refund abuse | Admin fraud → alerts; blocked user | blocked@demo.dlm |
| High risk customer | Trust scores + fraud tabs | highrisk@demo.dlm |
| Partner complaint spike | Fraud alert on HSR partner | admin@demo.dlm |
| Fake damage claim | File new dispute with photos | customer@demo.dlm |
| Chargeback | Trust event on blocked user | admin trust/fraud |
| Missing item | New dispute type missing_item | customer |

---

## 6. End-to-end gold path (recommended)

Complete flow when bulk seed lacks evidence:

| Step | Role | Action |
| ---- | ---- | ------ |
| 1 | customer@demo.dlm | Discover → checkout → place order |
| 2 | partner.koramangala@demo.dlm | Accept → pickup photos → inventory |
| 3 | partner | Progress washing → ready → out for delivery |
| 4 | partner | Delivery proof + OTP |
| 5 | customer | Confirm delivery; submit review |
| 6 | customer | File dispute with photo (optional) |
| 7 | admin@demo.dlm | Investigate dispute with full evidence |

**Validation:** Full chain visible in customer timeline, admin dispute bundle, trust/fraud hooks fire if applicable.

---

## 7. Known limitations (do not fail QA for these)

Documented in `MISSING_TEST_DATA.md`:

- Forgot/reset password UI missing
- Partner/admin notification pages use stubs
- Loyalty points not earned on orders
- No subscription customer UI
- Bulk orders lack pickup/delivery photos and custody detail
- Seeded disputes lack photo attachments
- No partial refund payment records

---

## 8. Quick smoke checklist (30 min)

- [ ] Login as admin, partner, customer
- [ ] Discover shows laundries
- [ ] Admin dashboard KPIs non-zero
- [ ] Admin orders list ~2000
- [ ] Admin disputes list 20
- [ ] Admin fraud 3+ alerts
- [ ] Admin trust scores for vip / highrisk
- [ ] Partner orders load and filter
- [ ] Customer orders and tracking load
- [ ] Place one new order E2E (optional but recommended)

---

## Related documents

| Document | Purpose |
| -------- | ------- |
| `UI_FEATURE_MAP.md` | Full feature inventory + API status |
| `TEST_DATA_AUDIT.md` | Counts before/after seed |
| `DEMO_ACCOUNTS.md` | All login credentials |
| `SEED_DATA_REPORT.md` | Seed script output |
| `MISSING_TEST_DATA.md` | Gaps and workarounds |
