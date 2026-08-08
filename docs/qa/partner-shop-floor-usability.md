# Partner Shop Floor — Usability checklist

> Timed tasks for **real counter partners** (or proxies).  
> Feature: [partner-shop-floor.md](../features/partner-shop-floor.md)  
> Automated twin: `frontend/tests/e2e/partner-shop-floor-journey.spec.ts`  
> Last updated: 2026-08-08

## Purpose

Validate that Shop Floor Mode works for non-tech / low-literacy staff under time pressure — **picture-first**, color tokens, print, status advance, reprint — without Advanced Mode.

## Setup (before the partner sits down)

| Item | Requirement |
| ---- | ----------- |
| Device | Phone or counter tablet (375–1024 px); Chrome / Edge |
| Mode | **Shop Floor** on (`More` → Display mode, or Settings) |
| Practice mode | Optional — enable under `More` / Settings so the amber banner is visible; **does not** invent offline demo orders |
| Data | Staging or local with QA seed (see [Staging seed](#staging-seed-steps)) |
| Catalog | Partner must have **Shirt / T-shirt** + **Saree** offered on Garment prices (Cloth Wall photos) |
| Printer | Optional; HTML preview + Print button counts as pass for tasks 2–3 & 5 |
| Facilitator | One timer; do **not** coach mid-task unless recording a fail |

**Practice mode note:** Full in-app fake order payloads would duplicate API contracts and drift from production. Practice mode is a **training flag + banner** only. Sessions run against seeded staging/local data.

## Timed tasks

Record start/stop per task. Mark **Pass** / **Fail** / **N/A**. Fail if facilitator help was required (except reading the task aloud once).

| # | Task | Time box | Pass criteria |
| - | ---- | -------- | ------------- |
| **1** | Create walk-in for **3 shirts + 1 saree** using **ONLY pictures** (no typing garment names; List mode off) | **&lt; 90 s** | Order saved; success shows tracking + color token; qty = 4 pieces (3 shirt + 1 saree) |
| **2** | Print tags and confirm **color token** visible | **&lt; 30 s** | Tags preview open; `R-##` (or spoken color+number) readable on bag/master tag |
| **3** | Print bill | **&lt; 20 s** | Bill preview open; total + CGST/SGST visible; Print CTA present |
| **4** | Mark order **washing** then **ready** without help | **&lt; 45 s** | From **Aaj ka Kaam**: Received→Washing→Ready; no Advanced sidebar used |
| **5** | Find order by **phone** and **reprint tags** | untimed soft target **&lt; 45 s** | Print center search by phone (or last-4) → Tags; same token as task 2 |

### Facilitator script (Hinglish OK)

1. “Phone + name daalo, phir kapde ki photo pe tap — teen shirt, ek saree. List mode mat kholo.”
2. “Tags print / preview — color number dikhao.”
3. “Bill print / preview.”
4. “Aaj ka Kaam pe jaao — pehle dhulai, phir ready.”
5. “Print pe phone se order dhoondo, tags dubara kholo.”

### Fail criteria (any one)

- Needs another person to explain a screen mid-task  
- Creates wrong SKUs / wrong qty  
- Cannot complete create in 90 s  
- Hands over or advances the **wrong** bag when two similar tokens exist  
- Uses Advanced Mode to finish any of tasks 1–5

### Soft metrics (cohort of 3–5)

- Task success ≥ 4/5 participants on tasks 1–4  
- Critical errors (wrong customer / wrong bag) = **0**  
- Median create (task 1) &lt; 75 s

## Practice mode (in-app)

| Control | Location |
| ------- | -------- |
| Toggle | Shop Floor **More** → Practice mode; also **Settings** → Practice mode |
| Storage | `localStorage` key `dlm.partner_practice_mode` (`true` / `false`) |
| Banner | Amber note on partner chrome while enabled — “Practice mode — use seed/staging data, not live customers” |

### Voice prompts (optional)

| Control | Location |
| ------- | -------- |
| Toggle | **More** / **Settings** → Voice prompts (default OFF) |
| Sound OFF | Same panel — blocks speech even if prompts ON |
| Gates | Setting ON + not `prefers-reduced-motion` + Sound not OFF + `speechSynthesis` available |
| Lines | Success: “Order save हो गई”; Tags: “Tags print karo — bag pe chipkao”; Bill: “Bill print ready hai” |

### Coach mark

Sticky “Show my next step” on Cloth Wall for the first **3** successful creates on the device (`dlm.partner_floor_coach_orders`). Dismissible; auto-hides after 3.

### Color-blind / phone / perf notes for facilitators

- Color tokens must show **pattern** (stripe/dot) on swatch + tag bar — fail if hue-only.
- Phone entry should offer the **huge keypad** (typing optional).
- Shop Floor home must remain chart-free (4 tiles only).

Enabling Practice mode does **not** switch off live APIs. Use seed accounts below.

## Staging seed steps

Use these when Practice mode alone is not enough (empty Cloth Wall / no orders).

### Local / staging API

```bash
# From backend/
python scripts/seed_qa.py
# Optional demo laundries + catalog repair:
# python -m app.db.seed_demo   # if your environment exposes ensure_demo_data
```

Also ensure WashHouse catalog + partner **offered** prices:

1. Login as `partner.koramangala@demo.dlm` / `Partner@1234` (or staging partner).  
2. Open **More → Garment prices** (`/partner/pricing`).  
3. Offer at least **Shirt / T-shirt** (`men-shirt-tshirt`) and **Saree** (`women-saree-normal`) with dual dry-clean prices.  
4. Set device to **Shop Floor**; optionally enable **Practice mode**.  
5. Run timed tasks 1–5 on `/partner`.

### Staging checklist for facilitators

- [ ] API healthy; partner can login  
- [ ] Cloth Wall shows shirt + saree photos (not empty / List-only)  
- [ ] Thermal/HTML print opens without console errors  
- [ ] Today board lists the new order after create  
- [ ] Print center finds order by phone last-4  

### Playwright (CI / smoke twin)

```bash
# FE :3000, API optional (journey mocks APIs)
cd frontend
npx playwright test tests/e2e/partner-shop-floor-journey.spec.ts
# Skip auth-dependent suites without seed:
# E2E_SKIP_AUTH=1
```

Journey covers: Cloth Wall 3 shirts + 1 saree → tags token → bill → Today washing→ready → Print center phone search → reprint tags. Uses route mocks so it does not require a live catalog seed.

## Score sheet (copy per participant)

| Participant | Device | Task1 | Task2 | Task3 | Task4 | Task5 | Notes |
| ----------- | ------ | ----- | ----- | ----- | ----- | ----- | ----- |
| | | /90s | /30s | /20s | /45s | | |

**Session date:** _______________  
**Build / env:** _______________  
**Facilitator:** _______________

## Related

- Feature non-tech plan: [partner-shop-floor.md § Non-tech usability test plan](../features/partner-shop-floor.md#non-tech-usability-test-plan)  
- Testing strategy: [../testing/strategy.md](../testing/strategy.md)  
- E2E smoke (partial): `frontend/tests/e2e/partner-shop-floor.spec.ts`
