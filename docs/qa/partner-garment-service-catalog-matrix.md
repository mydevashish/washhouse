# QA matrix — Partner garment service catalog

> Feature: [partner-garment-service-catalog.md](../features/partner-garment-service-catalog.md)  
> Prompt pack: [partner-garment-service-catalog-bulk.md](../../.cursor/prompts/partner-garment-service-catalog-bulk.md)  
> Last updated: 2026-08-14 (Prompt 9)

Pass = expected behavior with real or mocked API. Fail = broken import, wrong prices on counter, missing cross-links, or a11y blockers.

| ID | Surface | Action | Expected | 375 | 1280 | Light | Dark |
| -- | ------- | ------ | -------- | --- | ---- | ----- | ---- |
| G1 | Empty state | Load `/partner/services` with no catalog | Empty copy + upload CTA; template download works | PW | PW | manual | manual |
| G2 | Bulk import | Upload `Default.xls` (313 rows) | Preview → confirm → summary; completes in &lt;30s locally | manual | manual | manual | manual |
| G3 | Bulk import | Upload 3-row CSV fixture | 3 valid rows; result live region announces count | PW | PW | manual | manual |
| G4 | Template | Download template | `.xlsx` with Default.xls column headers | PW | PW | manual | manual |
| G5 | CRUD | Add garment + image | Create API + optional image upload; appears in list | manual | manual | manual | manual |
| G6 | CRUD | Edit dry clean price | PATCH rate; table/card updates after invalidation | PW | PW | manual | manual |
| G7 | Visibility | Toggle show/hide | `is_visible` flips; hidden items excluded from Cloth Wall | manual | manual | manual | manual |
| G8 | Bulk delete | Delete by category | Category garments removed; confirm dialog | PW | PW | manual | manual |
| G9 | Bulk delete | Delete all | Requires typing `DELETE` | manual | manual | manual | manual |
| G10 | Bulk delete | Selected rows | Checkbox select + delete selected | manual | manual | manual | manual |
| G11 | Hub | Services pillar / modal | Links to `/partner/services`; garment KPIs | Jest | Jest | manual | manual |
| G12 | Pricing cross-link | `/partner/pricing` footer link | "Counter rate card → Service catalog" → `/partner/services` | Jest | Jest | manual | manual |
| G13 | Service catalog footer | `/partner/services` pricing link | "Marketplace garment prices" → `/partner/pricing` | Jest | Jest | manual | manual |
| G14 | Cloth Wall | Walk-in new order | Garment tiles from catalog when non-empty; fallback to legacy | Jest | Jest | manual | manual |
| G15 | Pagination | 20+ garments | Only current page images mount (LazyMount); no 313-image flood | manual | manual | manual | manual |
| G16 | a11y | `/partner/services` | axe: no critical/serious violations; table `scope="col"` | PW | PW | manual | manual |
| G17 | a11y | Import result step | `role="status"` + `aria-live="polite"` on result panel | PW | Jest | manual | manual |
| G18 | Auth | Partner A vs B | Partner A cannot mutate Partner B catalog (API 403) | pytest | pytest | manual | manual |
| G19 | Legacy | `GET /partner/services` deprecated | Still works; docs note deprecation | pytest | — | manual | manual |
| G20 | Mobile grid | Card grid at 375px | Two-column cards; edit/visibility tappable (≥44px) | manual | — | manual | manual |

## Automated

| Test | Covers |
| ---- | ------ |
| pytest `test_partner_garment_catalog.py` | G18, G19 (API) |
| Jest garment catalog + cloth-wall | G6, G11, G14 |
| Jest price list view | G12 |
| Jest garment catalog page | G13 |
| Playwright `partner-garment-catalog.spec.ts` | G3, G4, G6, G8, G16, G17 |

## Manual-only (staging)

- G2 — full 313-row Default.xls performance on partner hardware
- G5, G7 — image upload + visibility on real storage
- G9, G10 — destructive bulk delete with typed confirm
- G15 — network tab: lazy thumbnail mount on scroll
- G20 — one-handed mobile UX on device

---

## Dark mode — styling audit (2026-08-14)

**Scope:** `frontend/features/partner/garment-catalog/**` — semantic tokens (`border-border`, `bg-muted`, `text-muted-foreground`) with explicit `dark:` on status tints (emerald/amber import rows, summary chips, visibility icon).

**Out of scope:** API, import parser, Cloth Wall order payload (`garment_item_id` deferred).
