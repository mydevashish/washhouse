# Partner Customers & Orders Hub — QA matrix

> Prompt 8 lock — 2026-08-08  
> Spec: [`partner-customers-orders-hub.md`](../features/partner-customers-orders-hub.md)  
> Prompt pack: [`.cursor/prompts/partner-customers-orders-hub.md`](../../.cursor/prompts/partner-customers-orders-hub.md)  
> Pagination: do not regress default **page_size 10** — see [`partner-admin-pagination-matrix.md`](./partner-admin-pagination-matrix.md)

Legend: **Y** = automated green · **M** = manual · **P** = partial / covered by related suite · **—** = N/A

## Critical path matrix

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 1 | Nav: single **Customers & Orders**; no New Order / Walk-in / People › Customers | Y | `partner-orders-hub.spec.ts` (drawer nav) · `partner-nav.test.ts` | Y |
| 2 | Find customer → new order → **Print tags** | Y | Desk path in hub smoke · Cloth Wall create + `walk-in-success-print-tags` in `partner-journey.spec.ts` / `partner-shop-floor.spec.ts` | Y |
| 3 | Ready order → **Print bill / GST invoice** | Y | Print CTAs on Cloth Wall success + bill/invoice routes in `partner-shop-floor.spec.ts`; hub compact print via unit `print-order-actions.test.tsx` | Y |
| 4 | Chips: Needs action / Walk-in / Ready today (URL deep-link) | Y | `partner-orders-hub.spec.ts` + Jest chip URL tests | Y |
| 5 | Directory → customer orders (scoped hub) | Y | Directory card → View orders / customer scope in hub P8 smoke; href unit tests | Y |
| 6 | Settings: **no** Shop Floor display mode | Y | `partner-orders-hub.spec.ts` settings smoke | Y |
| 7 | English UI smoke (hub header, empty, settings help) | Y | Hub heading + description; settings “Customers & Orders” help | Y |
| 8 | Pagination still default **10** | Y | Network assert `page_size=10` on hub orders list · pagination matrix + BE tests | Y |
| 9 | Mobile **375px** critical path | Y | Hub + floor specs `test.use({ viewport: { width: 375, height: 812 } })` | Y |
| 10 | Legacy redirects (`/walk-in-orders`, `/floor/today|ready|more`, customers/desk/BR) | Y | Hub smoke + `partner-shop-floor.spec.ts` P7 migration | Y |
| 11 | `/partner` is Owner overview — **not** 4-tile Shop Floor | Y | `partner-shop-floor.spec.ts` (no `shop-floor-home-tiles` / bottom nav) | Y |
| 12 | Print center reachable from hub chip/header | Y | Hub chip `print` + header Print href | Y |

## Visual polish (UI pack 2026-08-08)

| Check | Notes | Status |
| ----- | ----- | ------ |
| Header: New order primary; Print/Requests quiet `h-9` | Manual light+dark | M |
| Chips compact (`h-8`/`h-9`); filters one row desktop / 3-col mobile | Manual 375 / 1280 | M |
| Orders first viewport: slim metrics + find strip; no fat Waiting panel | Unit today-panel | Y |
| Status badges readable (icon + label) | Manual light+dark | M |
| Your pillars split card — title/subtitle AA on solid panel | Manual `/partner` | M |
| Order row/card actions compact; print icons `h-8` | Manual + unit | M |
| Pagination default **10** unchanged | Existing matrix row 8 | Y |

## Manual (staging / seed partner)

| Check | Notes |
| ----- | ----- |
| Thermal / browser print tags + bill | Real printer optional; browser print dialog OK |
| Dark mode readable @ 375px | Chips, FAB, empty state, success panel |
| Migrate `localStorage dlm.partner_ui_mode=shop_floor` → Advanced shell | One reload |
| Directory New order prefilled phone | ≤ 2 taps from card |
| Voice prompts default OFF; English when enabled | Settings › Voice |

## CI commands

```bash
cd frontend
pnpm exec jest features/partner/orders-hub features/partner/lib/partner-nav.test.ts features/partner-shop-floor/components/print-order-actions.test.tsx features/partner-shop-floor/components/order-create-success-panel.test.tsx --passWithNoTests
pnpm exec playwright test tests/e2e/partner-orders-hub.spec.ts tests/e2e/partner-shop-floor.spec.ts
```

Skip auth-gated E2E with `E2E_SKIP_AUTH=1` when seed DB unavailable.

## Open gaps

**None for P8 critical path.** Repeat-customers chip remains deferred (spec open question). WhatsApp invoice share deferred.
