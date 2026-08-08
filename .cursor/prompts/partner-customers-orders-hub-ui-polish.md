# Customers & Orders Hub — UI / UX polish prompt pack

> Paste prompts **in order** (0 → 5). Each prompt = one focused Cursor Agent session.  
> Goal: make **Customers & Orders** feel like a premium counter workplace — tight, aligned, calm — and fix **Your pillars** so titles/subtitles are always readable.  
> This pack is **visual + interaction polish only**. Do **not** change IA, API contracts, chips semantics, or print lifecycle from [`partner-customers-orders-hub.md`](partner-customers-orders-hub.md).

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through Acceptance).
3. Run Prompt 0 first — lock the visual system before coding.
4. After Prompt 5, run the manual checklist at the bottom.
5. Related (do not contradict):
   - [`docs/features/partner-customers-orders-hub.md`](../../docs/features/partner-customers-orders-hub.md)
   - [`docs/features/partner-owner-command-center.md`](../../docs/features/partner-owner-command-center.md)
   - `.cursor/rules/13-ui-ux.md`, `19-responsive-design.md`, `10-accessibility.md`

## Pain inventory (from product review — fix these)

| Area | What’s wrong today | Target feel |
| ---- | ------------------ | ----------- |
| **Header actions** | Print / New order / Requests fight for space; oversized `min-h-[44px]` on every control | One primary + quiet secondaries; compact on `md+`, touch-safe on mobile |
| **Shortcut chips** | Tall rounded-full pills, heavy padding, wrap chaos on desktop | Slim **segment / chip rail** — equal height, tight gap, readable selected state |
| **Filter bar** | Search + 3 selects loose; big vertical gaps; uneven widths | Single **toolbar row** on `sm+`; aligned baselines; controlled widths; no orphan whitespace |
| **Today strip + Find customer + Waiting requests** | Stacked panels = noisy first viewport; duplicate CTAs | Compress snapshot; demote secondary panels; one clear focus |
| **Order row / card CTAs** | Full-width giant buttons feel “app demo”, not ops tool | Compact primary advance; secondary print as icon+text or ghost |
| **Status badges (“pills”)** | Low contrast / tiny type / muddy muted fills | Crisp pill with icon + label; WCAG AA on light & dark |
| **Your pillars** (`/partner`) | Image cards; text washed by gradient; subtitle hard to read | Strong scrim, larger title, subtitle always legible; refined badge |

**Design thesis:** Calm ops density. Think “Apple Settings + Linear inbox” for laundry counters — not a marketing landing, not a fat POS. English-first. Tokens only (`tokens.css`). No purple-gradient AI look, no cream+terracotta brochure look, no glow stacks, no emoji.

**Density rules (HARD — every prompt must obey):**

```text
Touch floor (mobile): min tap 40×40 (prefer 44×44 for primary only)
Desktop compact: controls h-9 (36px) unless primary CTA
Chip height: h-8 sm:h-9 (not min-h-[44px] on every chip)
Filter gap: gap-2 (8px) — never gap-4+ between filter controls
Section rhythm: space-y-3 (12px) between related blocks; space-y-5 only between major regions
Horizontal filter align: items-center; shared h-9 / h-11 on same row
Radius: chips → rounded-full or rounded-lg (pick ONE system in Prompt 0); cards → rounded-xl
```

---

## Prompt 0 — Visual system & declutter decisions (PM + UX) — DO FIRST

```
Act as ui-ux-designer + product-manager for DLM WashHouse Partner.

Read first:
- AGENTS.md
- .cursor/rules/00-project-overview.md, 13-ui-ux.md, 19-responsive-design.md, 10-accessibility.md, 16-cursor-operating-rules.md
- .cursor/context/current-status.md
- docs/features/partner-customers-orders-hub.md
- docs/features/partner-owner-command-center.md
- frontend/styles/tokens.css
- frontend/features/partner/orders-hub/partner-orders-hub.tsx
- frontend/features/partner/orders-hub/partner-orders-shortcut-chips.tsx
- frontend/features/partner/orders-hub/partner-orders-filter-bar.tsx
- frontend/features/partner/orders-hub/partner-orders-today-panel.tsx
- frontend/features/partner/orders-hub/partner-recent-customers-strip.tsx
- frontend/features/partner/orders-hub/partner-orders-new-order-sheet.tsx
- frontend/features/partner/components/partner-status-badge.tsx
- frontend/features/partner/components/partner-orders-table.tsx
- frontend/features/partner/partner-order-card.tsx
- frontend/features/partner/views/partner-overview-view.tsx
- frontend/features/partner/components/owner/owner-pillar-card.tsx
- frontend/features/orders-hub/orders-hub-tabs.tsx (or wherever OrdersHubTabs lives)

Outcome:
Write a short polish spec (append section to docs/features/partner-customers-orders-hub.md OR create docs/features/partner-customers-orders-hub-ui-polish.md).

Title: “Customers & Orders Hub — Visual polish”

Must decide HARD (no waffle):

1) First-viewport composition on `/partner/orders?tab=orders`
   - What stays above the fold on 375px: header, tabs, chips, filters, table start?
   - What gets collapsed / moved: TodayChip strip, Find customer panel, Waiting requests panel, Recent customers strip?
   - Propose exact order of blocks + which become “collapsed by default” or linked-out.

2) Control size system
   - Define ButtonSizeMap: header primary / header secondary / chip / filter / table row action / FAB.
   - Kill blanket `min-h-[44px]` on every outline button; keep WCAG touch targets via padding + hit-area without visually huge chrome.

3) Chip visual language
   - Selected / unselected / print-link styles (border, bg, text, icon size).
   - Horizontal scroll on mobile vs wrap on desktop — pick one pattern and spacing (gap-1.5 or gap-2).

4) Filter toolbar layout
   - Desktop: one row — search (flex-1 max-w) + 3 selects same height, equal-ish widths, right-aligned or trailing.
   - Mobile: search full width; selects in 3-col grid OR horizontal scroll — pick one; no giant empty gutters.

5) Status badge redesign
   - Contrast pairs for every status (light + dark).
   - Font size ≥ 11px / medium weight; icon 12px; padding px-2 py-0.5; no washed-out muted-on-muted.

6) Your pillars redesign (`OwnerPillarCard`)
   - Fix illegible title/subtitle over photos.
   - Options to choose ONE: (A) stronger bottom scrim + text-shadow, (B) solid footer bar under image, (C) split card (image top 55% / solid text panel bottom). Prefer B or C for guaranteed readability.
   - Title ≥ text-sm font-semibold; subtitle ≥ text-[11px] with contrast ≥ 4.5:1 against its immediate bg.
   - Badge placement that doesn’t collide with title.

7) Order list density
   - Desktop table vs mobile card: reduce button height, shrink PrintOrderActions footprint, align status + source badges on one meta row.

8) Non-goals
   - No IA / tab / chip semantic changes
   - No new APIs
   - No Shop Floor mode revival
   - No redesign of Logistics / Money / Staff hubs in this pack (pillars card only)

9) Before/after microcopy if any labels change (keep English)

Acceptance:
- Spec file committed with decisions table + ASCII layout of orders tab first viewport.
- Explicit Component → change map listing every file above.
- Update .cursor/context/current-status.md pointer to this polish work.
- logs/feature-progress.md note: UI polish pack started.
```

---

## Prompt 1 — Hub density: header, chips, filter toolbar

```
Act as ui-ux-designer + frontend-architect.

Implement Slice P1 of the Customers & Orders visual polish spec (from Prompt 0).
Focus ONLY: page header actions, shortcut chips, filter bar, recent strip spacing — make the top of `/partner/orders` feel tight and professional.

Read:
- The polish spec from Prompt 0
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md, 10-accessibility.md
- frontend/features/partner/orders-hub/partner-orders-hub.tsx
- frontend/features/partner/orders-hub/partner-orders-shortcut-chips.tsx
- frontend/features/partner/orders-hub/partner-orders-filter-bar.tsx
- frontend/features/partner/orders-hub/partner-recent-customers-strip.tsx
- frontend/features/partner/orders-hub/partner-customer-scope-bar.tsx
- frontend/features/partner/components/partner-content.tsx (PartnerPageHeader)
- frontend/components/ui/button.tsx, input.tsx, select.tsx
- Existing tests: partner-orders-hub.test.tsx

Requirements:

HEADER
- Title stays “Customers & Orders”; description one calm line (shorten if noisy).
- Actions: New order = primary (size sm / h-9 on md+). Print center + Requests = outline/ghost, visually quieter, same height.
- On mobile: wrap cleanly with gap-2; no oversized stacked bricks.
- Remove redundant visual weight (double borders, excess padding).

SHORTCUT CHIPS
- Reduce visual mass: height h-8 (mobile) / h-9 (sm+); px-2.5–3; text-xs or text-sm; icon h-3.5.
- Gap: gap-1.5. Selected: solid brand, clear contrast. Unselected: subtle border, not heavy cards.
- Keep keyboard toolbar a11y (arrows / Home / End) and testids.
- Print chip remains a Link but matches chip chrome (not a separate big button).
- Desktop: prefer single wrapping row without huge leftover empty band under chips.

FILTER BAR
- Rebuild layout to match spec:
  - sm+: `flex items-center gap-2` one row; search `flex-1 min-w-[12rem] max-w-md`; selects fixed widths (e.g. w-[8.5rem] / w-36) all `h-9`.
  - mobile: search full width; selects in `grid grid-cols-3 gap-2` with compact selects (or horizontal scroll if spec chose that) — NO stacked full-width selects creating tall empty feel unless unavoidable.
- Shared control height with chips visually related (align optical weight).
- Placeholder stays English and short.

RECENT STRIP + SCOPE BAR
- Tighten: smaller chips (min-h-9 not 44), less padding, quieter label.
- space-y between strip → chips → filters = 2–3 (8–12px), not 4–5.

DO NOT
- Change chip IDs / filter query params / API.
- Touch today panel, table, pillars (later prompts).

TESTS
- Update hub unit tests if class/structure assertions break; keep data-testid stable.

Acceptance:
- At 1280px: header + chips + filters look like one composed toolbar region; no large dead gaps.
- At 375px: chips scroll or wrap cleanly; filters aligned; no giant buttons dominating.
- Keyboard + screen reader labels still work.
- Lint/typecheck clean for touched files.
- logs/implementation-log.md + feature-progress note for P1.
```

---

## Prompt 2 — Declutter Orders first viewport (Today panel)

```
Act as ui-ux-designer + frontend-architect.

Implement Slice P2: declutter `PartnerOrdersTodayPanel` so the Orders tab is not a wall of panels before the queue.

Read:
- Polish spec (Prompt 0 decisions on first-viewport)
- frontend/features/partner/orders-hub/partner-orders-today-panel.tsx
- frontend/features/partner/components/partner-panel.tsx
- frontend/features/partner/customer-desk/components/partner-customer-desk-search.tsx
- partner-orders-today-panel.test.tsx

Requirements:

COMPOSITION (follow spec exactly)
- Compress TodayChip strip into a slim metric row OR inline stats under chips — not three fat cards.
- Find customer: keep phone search useful, but shrink panel chrome (less description fluff, smaller toolbar buttons, tighter body padding).
- Waiting requests: if spec says collapse — use a single compact row/link with count, OR accordion closed by default; do not show a full list + Find customer + chips as competing heroes.
- Remove duplicate CTAs that already exist in header/tabs (e.g. “All requests” / “Full Customer Desk” if they clutter — keep one quiet link max).

VISUAL
- Unify radii/borders with hub (no mismatched shadow-soft stacks).
- Buttons in this panel: size sm / h-9; stop forcing min-h-[44px] on every outline control (ensure tap target via py + min touch where needed).
- InfoBanner: keep if legally/product useful; otherwise demote to one-line hint.

A11Y
- Preserve search labels; don’t remove focus management.
- Counts remain text, not color-only.

TESTS
- Update today-panel tests for new structure; keep critical testids if possible (`partner-orders-today-strip`).

Acceptance:
- On 375px Orders tab, user sees chips + filters + table within ~1.5 screens without endless scrolling past empty panel chrome.
- No regression to desk drawer / booking request create flows.
- logs updated for P2.
```

---

## Prompt 3 — Your pillars: readable, cool, aesthetic

```
Act as ui-ux-designer + frontend-architect + accessibility-reviewer.

Implement Slice P3: redesign `OwnerPillarCard` + “Your pillars” section so text is always visible and the grid feels premium.

Read:
- Polish spec Prompt 0 § pillars decision (must follow chosen A/B/C)
- .cursor/rules/13-ui-ux.md, 10-accessibility.md, 18-animation-usage.md (if motion exists)
- frontend/features/partner/components/owner/owner-pillar-card.tsx
- frontend/features/partner/views/partner-overview-view.tsx
- OwnerSectionHeader, OwnerPillarMotionGrid/Item
- Pillar image assets under frontend/public (paths from OWNER_PILLARS)

Requirements:

READABILITY (HARD)
- Title and subtitle must pass WCAG 2.1 AA against the text’s background in light AND dark.
- Never rely on a weak gradient alone over busy photos.
- Implement the chosen pattern from the spec (prefer solid footer bar OR split image/text panel).
- Title: clear hierarchy; subtitle: 1–2 lines, never clipped into illegibility.
- Badge: high-contrast accent; does not cover title.

AESTHETIC
- Consistent card height on mobile 2-col and desktop 4-col.
- Subtle hover (scale ≤ 1.02 or shadow lift) — calm, not flashy.
- Respect prefers-reduced-motion.
- No purple glow, no glassmorphism stack, no emoji.
- Arrow affordance small and aligned.

SECTION
- “Your pillars” header: shorter description; tighter mt between header and grid (mt-2/mt-3).
- Grid gaps: gap-2 / gap-2.5 — even, not sparse.
- Storefront pillar below fold (if kept) uses same card component styles.

A11Y
- Link name includes title (+ badge count if present).
- Images keep meaningful alt (decorative handling only if text is complete in link name — follow existing a11y rules).

TESTS
- Add/adjust unit test or Story if present; at minimum assert title/subtitle render and href.

Acceptance:
- Manual: pillars on `/partner` — titles readable on all 4 images, light + dark.
- Screenshot-level polish: equal heights, aligned text baselines, crisp badges.
- No layout shift from Image fill.
- logs + current-status note for P3.
```

---

## Prompt 4 — Status badges, order rows, and button scale

```
Act as ui-ux-designer + frontend-architect.

Implement Slice P4: status “pills”, order list/card actions, and print CTAs — stop oversized buttons; make meta info crisp.

Read:
- Polish spec
- frontend/features/partner/components/partner-status-badge.tsx
- frontend/features/partner/components/partner-order-source-badge.tsx
- frontend/features/partner/components/partner-orders-table.tsx
- frontend/features/partner/partner-order-card.tsx
- frontend/features/partner-shop-floor/components/print-order-actions.tsx
- frontend/features/partner/components/partner-order-status-stepper.tsx (only if contrast issues)
- Order status color tokens in tokens.css / tailwind

Requirements:

STATUS BADGE
- Redesign styles for contrast: each status gets bg + fg that work in light/dark.
- Size: text-[11px] or text-xs font-medium; icon 12px; gap-1; rounded-full or rounded-md (match chip system from Prompt 0).
- Never muted text on muted bg. Cancelled/danger must stay clear.
- Status not by color alone (icon + label already — keep both).

ORDER TABLE / CARD
- Meta row: token · status · source · payment — aligned, wrapping cleanly.
- Primary advance / accept: size sm, not full-viewport brick unless mobile sticky footer pattern already required.
- Reject / secondary: ghost or outline compact.
- PrintOrderActions: compact cluster (icon buttons or sm ghosts); emphasize lifecycle primary without giant blocks.
- Reduce vertical padding in rows/cards; aim for scannable density.

BUTTON SCALE SWEEP (hub surfaces only)
- Grep `min-h-[44px]` under frontend/features/partner/orders-hub and partner-order-card / partner-orders-table / today-panel leftovers.
- Replace with the size system from Prompt 0; keep accessible hit targets.

DO NOT
- Change mutation logic, status machine, or print URLs.

TESTS
- Update any snapshot/class tests; status badge unit test if exists.

Acceptance:
- Order list looks calm; primary action obvious but not cartoon-large.
- Badges readable in light + dark.
- 375px cards still tappable; desktop table feels professional.
- logs for P4.
```

---

## Prompt 5 — Harmony pass: tabs, empty states, motion, QA

```
Act as frontend-architect + qa-engineer + ui-ux-designer.

Implement Slice P5: final visual harmony across the hub + regression check.

Read:
- Polish spec (all decisions)
- .cursor/rules/10-accessibility.md, 13-ui-ux.md, 02-code-quality.md, 16-cursor-operating-rules.md
- frontend/features/orders-hub/orders-hub-tabs.tsx
- frontend/features/partner/orders-hub/partner-orders-empty-state.tsx
- frontend/features/partner/orders-hub/partner-hub-motion.tsx
- frontend/features/partner/orders-hub/partner-orders-new-order-sheet.tsx
- Desk / directory / requests panels as rendered inside hub (embedded) — light touch only for padding consistency
- docs/qa/partner-customers-orders-hub-matrix.md

Requirements:

TABS
- OrdersHubTabs optical weight matches new chips (not chunky underline blobs).
- Badge on Requests tab stays compact.

EMPTY / LOADING
- Empty state illustration + CTA sized to new button system.
- Skeletons match new radii/heights (no huge 48px bars).

NEW ORDER SHEET / FAB
- Sheet choice rows: refined height, clear image crop, not oversized.
- FAB: keep mobile-only; slightly tighter (h-12) if still thumb-friendly; doesn’t obscure pagination.

MOTION
- Keep 2–3 calm transitions max; reduce if chips feel bouncy.
- prefers-reduced-motion respected.

CROSS-CHECK
- Dark mode: hub + pillars + badges.
- 375 / 768 / 1280 widths: alignment, no horizontal trap, no sparse deserts of whitespace in filter row.
- Pagination default page_size 10 unchanged.

QA
- Extend docs/qa/partner-customers-orders-hub-matrix.md with a “Visual polish” section (checklist rows).
- Run / fix unit tests for orders-hub; touch Playwright only if selectors broke.

DOCS / LOGS
- Spec status → review/done for polish
- logs/implementation-log.md, logs/feature-progress.md
- .cursor/context/current-status.md
- Link this prompt file from .cursor/prompts/README.md if not already

Acceptance:
- Hub feels one design system: header → tabs → chips → filters → list.
- Pillars readable.
- No functional regressions on chips/filters/print/new order.
- Lint + typecheck pass for touched packages.
```

---

## QA checklist (after Prompt 5)

Manual on partner account (light + dark):

### Customers & Orders (`/partner/orders`)
- [ ] Header actions same height; New order is the only loud button
- [ ] Shortcut chips compact; selected state obvious; no huge gaps under chip row
- [ ] Filters aligned on one row at desktop; 3-col or tidy stack on mobile — no random whitespace
- [ ] First viewport shows queue quickly (not buried under panels)
- [ ] Status badges readable; icons + labels clear
- [ ] Row/card actions compact; Print still reachable
- [ ] 375px: no horizontal scroll trap; FAB doesn’t hide critical controls
- [ ] Keyboard: chip toolbar arrows still work

### Your pillars (`/partner`)
- [ ] All pillar titles readable on photo cards
- [ ] Subtitles readable (AA contrast)
- [ ] Badges don’t cover text
- [ ] Equal card heights in 2-col and 4-col
- [ ] Hover/focus visible; reduced-motion OK

### Regressions
- [ ] Chip filters still change the list
- [ ] Search + status/source/payment still work
- [ ] New order sheet → walk-in / doorstep / desk
- [ ] Print center + print actions still work
- [ ] Pagination still default 10

---

## Suggested chat titles

| Prompt | Chat title |
| ------ | ---------- |
| 0 | Spec: Hub UI polish system |
| 1 | Hub chips + filter density |
| 2 | Declutter Orders today panel |
| 3 | Fix Your pillars contrast |
| 4 | Badges + order action scale |
| 5 | Hub harmony QA polish |

---

## Designer notes (for the human)

**Why it feels messy now:** the hub shipped feature-complete with accessibility-min heights (`min-h-[44px]`) applied to *every* control, picture-led panels stacked above the queue, and image pillars with a soft gradient that loses subtitle contrast. That’s correct for “ship the job,” wrong for “daily tool you’ll stare at 8 hours.”

**What “cool” means here:** quieter chrome, stronger hierarchy (one primary action), optical alignment (shared heights + 8px grid), and pillars that read like editorial cards — not washed photo tiles.

**Run order:** 0 → 1 → 2 → 3 → 4 → 5. Don’t skip 0 or engineers will “improve” chips and filters in conflicting directions.
