# Partner Four Pillars Workspace — QA matrix

> Prompt 8 lock — 2026-08-10  
> Spec: [`partner-customers-orders-four-pillars-workspace.md`](../features/partner-customers-orders-four-pillars-workspace.md)  
> Prompt pack: [`.cursor/prompts/partner-customers-orders-four-pillars-workspace.md`](../../.cursor/prompts/partner-customers-orders-four-pillars-workspace.md)  
> Parent hub matrix: [`partner-customers-orders-hub-matrix.md`](./partner-customers-orders-hub-matrix.md)  
> Pagination: default **page_size 10** in customers + orders modals — [`partner-admin-pagination-matrix.md`](./partner-admin-pagination-matrix.md)

Legend: **Y** = automated green · **M** = manual staging · **P** = partial · **—** = N/A

## Layout & pillars

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 1 | `/partner/orders` shows **4 pillars** above `OrdersHubTabs` | Y | `partner-orders-hub.test.tsx` · `partner-orders-hub.spec.ts` (`hub-pillar-grid`, all four `hub-pillar-*`) | Y |
| 2 | Mobile **375px**: 2×2 grid, no horizontal **page** scroll | M | Playwright viewport 375 in hub spec; manual light/dark | M |
| 3 | Desktop **1280px**: 4-across pillars, equal card height | M | `PartnerHubPillarGrid` `items-stretch` + card `h-full`; visual @ 1280 | M |
| 4 | Pillar KPIs load (customers dashboard, orders week, coupons active/total, services count) | P | Unit mocks in hub tests; manual with seed partner | M |

## Modal shell & URL

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 5 | Click pillar → `?workspace=` set (shallow replace) | Y | `partner-orders-hub.test.tsx` · E2E customers click | Y |
| 6 | Close modal (X / overlay) → `workspace` param cleared | Y | E2E `partner-orders-hub.spec.ts` after customers open | Y |
| 7 | **Escape** closes modal + clears param | P | shadcn Dialog; manual keyboard | M |
| 8 | Focus returns to triggering tile after close | P | `PartnerHubWorkspaceModal` microtask focus; manual | M |
| 9 | Modal **≤640px** full viewport; desktop **max 90vw × 90vh** | M | Tailwind classes on `PartnerHubWorkspaceModal`; manual 375 / 1280 | M |
| 10 | `data-testid="hub-workspace-{id}"` when open | Y | `partner-hub-workspace.test.tsx` · hub integration tests | Y |

## Customers workspace

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 11 | List server-paginated **page_size=10** | Y | `usePartnerHubCustomersList` · BE insights tests | Y |
| 12 | Debounced search; min 2 chars name / 4 digit phone hint | P | `partner-hub-customers-search` · manual typeahead | M |
| 13 | Row actions: Call, WhatsApp, New order, Desk hrefs | P | `owner-customer-crm` unit patterns; manual tel/wa | M |
| 14 | **Add customer** form + POST (Indian mobile) | Y | BE `test_partner` customer create · FE create dialog | Y |
| 15 | Empty / loading / error + retry | P | testids `hub-customers-*`; manual error inject | M |
| 16 | Footer pagination next/prev hits network | M | DevTools Network on page 2 | M |

## Orders workspace

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 17 | Search (tracking, phone, name, token) debounced | Y | `partner-hub-orders-workspace.test.tsx` | Y |
| 18 | Server pagination **10**, bucket `all` | Y | `usePartnerHubOrdersList` · hub orders API tests | Y |
| 19 | KPI strip: this week + needs action badge | P | `hub-orders-kpi-strip` testid; manual data | M |
| 20 | **New order** → hub `?tab=create` | Y | `hub-orders-new` + `buildOrdersHubPath` | Y |
| 21 | Row: status advance + `PrintOrderActions` compact | P | Reuses `PartnerOrdersTable`; manual print | M |
| 22 | Table horizontal scroll inside modal on narrow width | M | `PartnerOrdersTable` `overflow-x-auto` | M |

## Coupons workspace

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 23 | Create coupon (code + %) | Y | `partner-hub-coupons-workspace.test.tsx` | Y |
| 24 | Toggle active / delete confirm / copy code | Y | Same suite + row testids | Y |
| 25 | Hint: apply on Create tab | — | Modal description copy | M |
| 26 | Table scroll on mobile | M | `overflow-x-auto` on coupons body | M |

## Services workspace

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 27 | Add / inline edit / pause / delete | Y | `partner-hub-services-workspace.test.tsx` | Y |
| 28 | Empty CTA **Add Wash & Fold** | P | EmptyState secondaryAction; manual | M |
| 29 | Footer link **Garment prices** → `/partner/pricing` | Y | `hub-services-footer` testid | Y |
| 30 | Walk-in composer still lists services (no catalog regression) | P | Existing walk-in tests; manual create tab | M |

## Nav & redirects

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 31 | Operations sidebar: **no** Services or Coupons | Y | `partner-nav.test.ts` · E2E hub spec | Y |
| 32 | Search aliases: Coupons/Services → hub `?workspace=` | Y | `partner-nav.ts` constants | Y |
| 33 | `/partner/coupons` → hub + coupons modal | Y | `partner-coupons-view.test.tsx` · E2E | Y |
| 34 | `/partner/services` → hub + services modal | Y | `partner-journey.spec.ts` · catalog view redirect | Y |
| 35 | Your shop › Service catalog bookmark still valid | M | Nav item href + redirect behavior | M |

## Regression guards

| # | Scenario | Automate | Test / evidence | Status |
| - | -------- | -------- | --------------- | ------ |
| 36 | Hub tabs (queue, create, desk, requests, directory) unchanged | Y | Existing hub matrix rows 1–10 | Y |
| 37 | Print routes + `/partner/floor/print` untouched | Y | Shop floor + print unit tests | Y |
| 38 | Light + dark readable (pillars + modals) | M | Manual @ 375 / 1280 both themes | M |

## CI commands (Prompt 8)

```bash
cd frontend
pnpm exec jest features/partner/orders-hub features/partner/lib/partner-nav.test.ts features/partner/views/partner-coupons-view.test.tsx --passWithNoTests

cd backend
pytest tests/api/test_partner.py tests/api/test_customer_desk.py -q
```

Optional E2E (auth seed):

```bash
cd frontend
pnpm exec playwright test tests/e2e/partner-orders-hub.spec.ts
```

Skip auth-gated E2E with `E2E_SKIP_AUTH=1` when seed DB unavailable.

## Manual staging checklist (post-pack)

| Check | Pass |
| ----- | ---- |
| `/partner/orders` shows 4 pillars above tabs | ☐ |
| Customers modal: 10 rows, next page hits network | ☐ |
| Add customer: name + phone saves and appears in search | ☐ |
| Orders modal: search by phone last 4 | ☐ |
| New order from customer row prefills create tab | ☐ |
| Coupons: create, toggle, delete in modal | ☐ |
| Services: add/edit/delete in modal | ☐ |
| Sidebar Operations has no Coupons/Services | ☐ |
| `/partner/coupons` opens hub + modal | ☐ |
| Light + dark, 375px, no horizontal page scroll | ☐ |

## Open gaps

**None blocking review.** Analytics events `partner_hub.pillar_open` / `workspace_create` remain optional follow-up. Full keyboard walk-through of all four modals recommended once on staging.

## Prompt 8 run log (2026-08-10)

| Suite | Result | Notes |
| ----- | ------ | ----- |
| Jest `features/partner/orders-hub` + nav + coupons redirect | **37/37 pass** | Includes pillar/workspace/coupons/services suites |
| `pytest test_partner.py test_customer_desk.py` | **Skipped locally** | Requires PostgreSQL `dlm_test` on localhost:5432 — run in CI or with test DB up |
| Playwright `partner-orders-hub.spec.ts` | Not run this session | Recommended with auth seed before staging sign-off |
