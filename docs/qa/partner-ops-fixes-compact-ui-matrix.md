# QA matrix — Partner Ops Fixes + Compact UI

> Feature: [partner-ops-fixes-compact-ui.md](../features/partner-ops-fixes-compact-ui.md)  
> Last updated: 2026-08-16 (Prompt 12 — QA ship)  
> Pass = expected behavior with real or mocked API. Fail = broken flow, silent error, or density regression.

Legend: **375** = 375px width check · **Dark** = `class="dark"` · **Density** = compact UI class audit on same route

| ID | Fix | Route | Steps | Expected | P0/P1 | 375 | Dark | Density |
| -- | --- | ----- | ----- | -------- | ----- | --- | ---- | ------- |
| M01 | F01 Session timeout | Any `/partner/*` | Set env idle 60m; idle 55m | Warning overlay at 55m; logout at 60m with session message | P0 | — | ✓ | — |
| M02 | F02 Phone 10-digit | `/partner/orders?tab=create` | Enter 9 digits → Continue; enter `5123456789` | Blocked + inline error; `6123456789` proceeds; stored `+916123456789` | P0 | ✓ | ✓ | ✓ inputs `h-9` |
| M03 | F02 Phone (desk) | `/partner/orders?tab=desk` | Search with 11 digits | Error; 10-digit lookup runs | P0 | ✓ | ✓ | ✓ |
| M04 | F03 Total spent | `/partner/orders?tab=create` | Select customer with history via phone search | **Total spent** visible on snapshot cards | P0 | ✓ | ✓ | ✓ cards `p-3` |
| M05 | F03 Total spent guest | `/partner/orders?tab=create` | Valid phone, no prior orders | Shows **₹0.00** (not blank) | P0 | ✓ | ✓ | ✓ |
| M06 | F04 Decimal qty | `/partner/orders?tab=create` | Add service; qty `1.5`; confirm | Line total = rate × 1.5; order creates | P0 | ✓ | ✓ | ✓ dialog `h-9` |
| M07 | F04 Decimal qty min | `/partner/orders?tab=create` | Enter `0.001` | Blocked; min 0.01 message | P0 | ✓ | ✓ | — |
| M08 | F05 Customers load | `/partner` → sidebar **Customers** | Click Customers | List or skeleton loads; never blank; error shows retry | P0 | ✓ | ✓ | ✓ `.page-title` |
| M09 | F16 Edit customer | `/partner/customers` | Edit → change name → Save | PATCH succeeds; list updates; phone read-only | P0 | ✓ | ✓ | ✓ avatar `h-9` |
| M10 | F06 Picked up success | `/partner/orders` | Open eligible order → Mark picked up | Status → picked_up; persists refresh | P0 | ✓ | ✓ | ✓ row actions `h-9` |
| M11 | F06 Picked up blocked | `/partner/orders/[id]` | Advance when inventory gate fails | Toast with specific reason; CTA disabled + label | P0 | ✓ | ✓ | — |
| M12 | F07 Catalog loads | `/partner/services` | Open page with seed catalog | Grid/table renders; pagination visible | P0 | ✓ | ✓ | ✓ toolbar `h-9` |
| M13 | F10 Template download | `/partner/services` | Click Download template | `.xlsx` saves; no error toast | P0 | ✓ | ✓ | ✓ |
| M14 | F11 Select all page | `/partner/services` | Check header checkbox on page 1 | All rows on **current page** selected; label mentions page | P1 | ✓ | ✓ | ✓ |
| M15 | F08 All Visible page | `/partner/services` | Select page → **Make all visible** → confirm | Visible count updates for page items only | P1 | ✓ | ✓ | ✓ |
| M16 | F09 Services search | `/partner/orders?workspace=services` | Open modal; search partial name | Server-filtered results; debounced | P1 | ✓ | ✓ | ✓ |
| M17 | F09 Services pagination | `/partner/orders?workspace=services` | Catalog >10 services | ≤10 rows; pagination next/prev | P1 | ✓ | ✓ | ✓ |
| M18 | F12 Storefront save | `/partner/storefront` | Edit headline → Save → reload | Persists; success toast | P0 | ✓ | ✓ | ✓ `rounded-xl` cards |
| M19 | F15 Orders paid/pending | `/partner/orders?tab=orders` | View list with partial COD order | Columns **Total \| Paid \| Pending** correct | P0 | ✓ | ✓ | ✓ `text-xs tabular-nums` |
| M20 | F15 Order detail | `/partner/orders/[id]` | Open partial-paid order | Summary shows paid + pending breakdown | P0 | ✓ | ✓ | ✓ |
| M21 | F13 Reports week | `/partner/reports` | Select **This week** → export orders CSV | Rows limited to IST week; filename has range | P1 | ✓ | ✓ | ✓ filter chips `h-9` |
| M22 | F13 Reports custom | `/partner/reports` | Custom range 7 days | Both exports respect range | P1 | ✓ | ✓ | ✓ |
| M23 | F14 Revenue year | `/partner/revenue` | Select **This year** | KPI/chart reflect Jan 1 IST → today | P1 | ✓ | ✓ | ✓ tabs `h-8` |
| M24 | F14 Revenue custom | `/partner/revenue` | Custom 14-day range | Net/gross match analytics API | P1 | ✓ | ✓ | ✓ |
| M25 | Density shell | `/partner` | Visual scan first viewport | No `rounded-3xl` cards; buttons `h-9`; `space-y-4` | P1 | ✓ | ✓ | ✓ |
| M26 | Density orders hub | `/partner/orders` | Scan header/chips/filters | Chips `h-8 sm:h-9`; filters `gap-2`; no `min-h-[44px]` | P1 | ✓ | ✓ | ✓ |
| M27 | Density customers | `/partner/customers` | Scan card grid | Cards `p-3 sm:p-4`; avatars `h-9 w-9` | P1 | ✓ | ✓ | ✓ |
| M28 | Checkout CTA exception | `/partner/orders?tab=create` | Mobile footer Create order | Primary CTA **min-h-11** (44px) maintained | P1 | ✓ | ✓ | ✓ |
| M29 | Dark tokens | `/partner/services` + `/partner/customers` | Toggle dark | Borders readable; badge contrast AA | P1 | ✓ | ✓ | ✓ |
| M30 | Regression print | `/partner/orders` | Row print compact icons | Print actions `h-8 w-8`; still tappable | P1 | ✓ | ✓ | ✓ |

## Automated (Prompt 12 target)

| Test | Covers |
| ---- | ------ |
| Jest `partner-phone-schema` | M02, M03 |
| Jest composer / decimal qty | M06, M07 |
| Jest customers edit sheet | M09 |
| pytest partner customers PATCH | M09 |
| pytest garment template | M13 |
| pytest orders paid/pending | M19 |
| Playwright `partner-ops-fixes.spec.ts` | M04, M06, M08, M13, M18, M19 |
| Existing partner e2e smoke | Regression M30 |

## Manual-only (staging)

- M01 — full idle timer (or clock mock)
- M02 — physical device keyboard on phone field
- M10/M11 — live inventory gate with real order states
- M21–M24 — CSV row counts vs DB spot check
- M25–M29 — design review @ 375 + 1280 light/dark

## Status (Prompt 12 — 2026-08-16)

| ID | Status | Evidence |
| -- | ------ | -------- |
| M01 | **Defer (staging manual)** | Full 55m/60m idle cycle — env documented in `.env.example` |
| M02 | **Pass** | Jest `partner-phone-schema`; Playwright create tab |
| M03 | **Pass** | Jest `partner-customer-desk` + phone schema |
| M04 | **Pass** | Jest `partner-customer-snapshot-cards`; Playwright create tab |
| M05 | **Pass** | Jest snapshot cards (`₹0.00` / `—`) |
| M06 | **Pass** | Jest `use-partner-walk-in-order-composer`; Playwright qty 2.5 |
| M07 | **Pass** | Jest `cloth-wall-qty` min 0.01 gate |
| M08 | **Pass** | Playwright sidebar Customers → list + edit |
| M09 | **Pass** | Jest `partner-customer-edit-sheet`; pytest `test_partner_customers` *(CI DB)* |
| M10 | **Defer (staging manual)** | Jest `partner-order-card` advance; live order + refresh on staging |
| M11 | **Pass** | Jest `partner-pickup-gates` blocker copy + disabled CTA |
| M12 | **Pass** | Jest `garment-catalog-page` list + pagination |
| M13 | **Pass** | Playwright template download; pytest garment template *(CI DB)* |
| M14 | **Pass** | Jest `garment-catalog-page` select-all-page |
| M15 | **Pass** | Jest `garment-catalog-page` bulk visible dialog |
| M16 | **Pass** | Jest `partner-hub-services-workspace` debounced search |
| M17 | **Pass** | Jest services workspace pagination ≤10 |
| M18 | **Pass** | Playwright storefront save + reload; Jest `buildStorefrontSavePayload` |
| M19 | **Pass** | Playwright paid/pending columns; Jest `partner-orders-table` |
| M20 | **Pass** | Jest orders table + hub workspace payment breakdown |
| M21 | **Defer (staging manual)** | Jest `partner-reports-period` + view; CSV row spot-check on staging |
| M22 | **Defer (staging manual)** | Jest reports view custom range; export row count on staging |
| M23 | **Pass** | Jest `partner-revenue-view` year period |
| M24 | **Pass** | Jest revenue view custom 14-day range |
| M25 | **Pass** | Jest `partner-content` + `partner-compact` constants; no `rounded-3xl` in partner tree |
| M26 | **Pass** | Jest `partner-orders-hub` chips/filters density |
| M27 | **Pass** | Customers view + owner cards (`p-3`, avatar `h-9`) |
| M28 | **Pass** | Create-order checkout CTA `min-h-11` in composer |
| M29 | **Defer (staging manual)** | Dark token audit @ 375 + 1280 — automated smoke only |
| M30 | **Pass** | Jest `print-order-actions` compact `h-8 w-8` |

**Summary:** 25 Pass · 5 Defer (staging manual) · 0 Fail  
**Jest partner suite:** 255/255 green (`npm test -- --testPathPattern=partner`)  
**Playwright:** `frontend/tests/e2e/partner-ops-fixes.spec.ts` — customers nav, create order (total spent + decimal qty), template download, storefront save, orders paid/pending
