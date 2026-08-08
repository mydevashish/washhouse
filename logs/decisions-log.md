# Decisions Log

> Lightweight decisions. Heavier ones get a full ADR under `docs/decisions/`.

## Entry template

```
### YYYY-MM-DD — <decision title>
- **Context:** ...
- **Options considered:** A, B, C
- **Decision:** <chosen option>
- **Why:** ...
- **Consequences:** ...
- **Revisit if:** ...
- **ADR:** `docs/decisions/ADR-NNN-...md` (if promoted)
```

## History

### 2026-08-08 — Shop Floor Web Speech opt-in (default OFF)
- **Context:** Low-literacy staff benefit from spoken cues on success/print; noisy counters + a11y need calm defaults.
- **Options considered:** (A) always speak, (B) opt-in setting + respect reduced-motion/Sound OFF, (C) no speech.
- **Decision:** (B) — `dlm.partner_floor_voice_prompts` default false; Sound OFF companion mute; never speak under `prefers-reduced-motion`.
- **Why:** Keeps success celebration calm by default; facilitators can enable voice during training.
- **Consequences:** Hindi voice quality depends on device TTS; no server TTS.
- **Revisit if:** Owners demand always-on voice for staff tablets.
- **ADR:** none

### 2026-08-08 — Shop Floor advance via existing accept/status APIs (no floor endpoint yet)
- **Context:** Spec proposed `GET /partner/floor/today` + `POST …/advance`; Today/Ready boards needed to ship.
- **Options considered:** (A) new floor endpoints + orchestration, (B) FE map + reuse `POST …/accept` + `PATCH …/status` with client-side chain for doorstep washing→ironing→ready.
- **Decision:** (B) for this slice — `floor-status.ts` + `useFloorOrderAdvance`.
- **Why:** Walk-in graph already matches simplified steps 1:1; avoids blocking on BE while shipping literacy UX; doorstep Ready one-tap needs at most two PATCHes.
- **Consequences:** Online `pickup_assigned→picked_up` still blocked by evidence rules; Given for doorstep stops at `out_for_delivery` (OTP). Optional dedicated floor API remains later.
- **Revisit if:** Evidence-free counter doorstep handoff or staff can't tolerate multi-hop errors.
- **ADR:** none

### 2026-08-08 — Invoice number allocated on first print/fetch (not create)
- **Context:** `invoice_number` was never set (BUG-SEC-001); Shop Floor bill/GST needs a stable number without recalculating totals.
- **Options considered:** (A) allocate on every order create, (B) allocate once on invoice JSON/print, (C) derive ephemeral number without persisting.
- **Decision:** (B) — `InvoiceService.ensure_invoice_number` on `GET …/invoice` using `WH-{IST_year}-{tracking_code}`; never overwrite; never touch GST/total fields.
- **Why:** Closes print gap immediately; tracking already unique; create-path allocation can follow without changing print consumers.
- **Consequences:** Orders never printed stay without invoice_number until first fetch; GSTIN still missing on laundry model (display —).
- **Revisit if:** Compliance requires allocate-on-create or FY sequential counters per laundry.
- **ADR:** none

### 2026-08-08 — Color token fields: token_code + token_day_number
- **Context:** Spec used `token_number` + display `R-42`; implement prompt asked for `token_code` + `token_day_number` (+ enum `color_token`).
- **Options considered:** (A) only `token_number`, (B) store `token_code` denormalized + `token_day_number` + `token_assigned_on` for uniqueness.
- **Decision:** (B) — persist `color_token`, `token_code`, `token_day_number`, `token_assigned_on`; unique per laundry/color/number/day.
- **Why:** Spoken/print UI needs stable `token_code`; day column required for daily uniqueness; avoids recomputing letter map inconsistently.
- **Consequences:** Slight denormalization; letter map must stay in sync in FE `color-tokens.ts` and BE `COLOR_TOKEN_LETTERS`.
- **Revisit if:** Owner reassign (P3) needs migration of historical codes.
- **ADR:** none

### 2026-08-08 — Cloth Wall catalog lines via walk-in bridge
- **Context:** Cloth Wall prefers partner garment price-list (`is_offered`) but `order_items.service_id` still requires `laundry_services`; full Slice E deferred.
- **Options considered:** (A) wait for Slice E FK, (B) name-match fragile mapping, (C) find-or-create bridged `laundry_services` from catalog price on walk-in create.
- **Decision:** (C) — extend `POST /partner/walk-in-orders` with `catalog_item_id` + `process`; bridge row `description=catalog:{id}:{process}`; lock unit price from `laundry_item_prices`.
- **Why:** Unblocks photo intake without schema change to `order_items`; keeps existing walk-in endpoint.
- **Consequences:** Hidden service rows appear in service catalog; later Slice E should attach real `catalog_item_id` and stop dual-writing.
- **Revisit if:** Partners edit/delete bridged services or booking needs catalog FKs on lines.
- **ADR:** `docs/features/partner-shop-floor.md` / schema Slice E note

### 2026-08-08 — Partner Shop Floor home URL
- **Context:** Spec initially used `/partner/floor` as Shop Floor home; P0 FE prompt places 4-tile home on `/partner` with mode preference.
- **Options considered:** (A) `/partner/floor` home + Advanced `/partner`, (B) single `/partner` home gated by `partner_ui_mode`.
- **Decision:** (B) — `/partner` shows Shop Floor tiles or Advanced Overview; floor boards under `/partner/floor/*`.
- **Why:** One bookmark for partners; mode is a device preference, not a separate app root.
- **Consequences:** `PartnerHomeView` + shell must read mode; Advanced deep links unchanged.
- **Revisit if:** Staff roles need forced Floor URL redirect from all Advanced routes.
- **ADR:** `docs/features/partner-shop-floor.md`

### 2026-08-08 — Partner Shop Floor vs Advanced Mode
- **Context:** Phase 1 partner ops (Overview / New Order / detail) is too dense for non-tech counter staff in India; owners still need full nav (Orders Hub, pricing, revenue).
- **Options considered:** (A) simplify entire partner shell, (B) dual mode — Shop Floor + Advanced, (C) separate staff PWA app.
- **Decision:** (B) — Shop Floor (4 tiles, Hinglish, color tokens, print) via `partner_ui_mode`; current `PARTNER_NAV_SECTIONS` remains Advanced Mode.
- **Why:** Same APIs/orders; staff get picture-first UX without stripping owner analytics/CRM.
- **Consequences:** Two FE surfaces to maintain; token columns + floor advance orchestration needed; print closes Phase 1 invoice/tag deferral via Floor path.
- **Revisit if:** Staff roles + permissions make a separate app cheaper than mode switch.
- **ADR:** documented in `docs/features/partner-shop-floor.md` (promote to ADR if mode persistence moves server-side).

### 2026-07-17 — Partner price-list bootstrap (empty + Apply suggested)
- **Context:** Platform WashHouse catalog needs suggested defaults, but partners must not be silently locked to WashHouse live rates.
- **Options considered:** (A) auto-seed overrides on laundry approve, (B) empty overrides + explicit “Apply suggested prices”, (C) implicit fallthrough to suggested as live price.
- **Decision:** (B) — partners start with zero `laundry_item_prices`; Apply suggested is Slice B UI/API.
- **Why:** Suggested ≠ live; marketplace “from” can still fall back to suggested when no partner priced an item.
- **Consequences:** Public laundry list empty until partner opts in; Slice B must ship Apply + editor.
- **Revisit if:** Partner activation lag hurts discovery density.
- **ADR:** documented in `docs/features/partner-price-list.md` Decision defaults (no separate ADR).

### 2026-07-17 — Catalog money columns (dual XOR single `price_inr`)
- **Context:** WashHouse tables mix dry-clean/press pairs with by-kg and household single rates.
- **Decision:** Dual `dry_clean_inr`+`press_inr` (press nullable) XOR single `price_inr`; CHECK enforces shape.
- **Why:** Avoid overloading dry-clean semantics for kg rates; keep press N/A as null.
- **Consequences:** Schema/docs in `docs/database/schema.md`; UI labels by category/mode in Slice B+.

### 2026-05-25 — Monorepo over polyrepo
- **Context:** Two services (FastAPI + Next.js) plus shared docs/logs.
- **Decision:** Monorepo (single `git` root).
- **Why:** Shared docs, atomic cross-stack changes, simpler CI, small team.
- **Revisit if:** Repo > 1M LOC, multiple deploy cadences clash, third-party access constraints.

### 2026-05-25 — App Router + Server Components default
- **Context:** Next.js 15.
- **Decision:** App Router; server components by default, `"use client"` only when needed.
- **Why:** Performance, streaming, server-fetch ergonomics.

### 2026-05-25 — Async SQLAlchemy
- **Context:** FastAPI is async.
- **Decision:** Async SQLAlchemy 2.x throughout.
- **Why:** Avoid sync/async mismatch; better throughput.

### 2026-05-25 — RS256 JWTs
- **Context:** Auth tokens.
- **Decision:** RS256 over HS256.
- **Why:** Public key can be safely distributed; better rotation story.

### 2026-05-25 — Conventional Commits + trunk-based
- **Decision:** Short-lived branches, squash-merge to `main`, Conventional Commits.
- **Why:** Clean history, auto-changelogs, simpler review.

### 2026-05-25 — TanStack Query as the only server-state layer
- **Decision:** No Redux. Zustand only for global UI/auth. RHF + Zod for forms.
- **Why:** Each tool has a single job; less ceremony, fewer bugs.
