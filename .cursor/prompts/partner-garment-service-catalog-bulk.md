# Partner Garment Service Catalog — bulk upload, CRUD, images

> Paste prompts **in order** (0 → 9). One Agent chat per prompt.  
> Goal: Reorganize **`/partner/services`** into a **garment × service-type price matrix** matching **`Default.xls`**, with **bulk upload**, **bulk delete**, **single-item CRUD**, and **optional garment images**. Keep walk-in / Cloth Wall working.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through acceptance criteria).
3. Read `AGENTS.md` + `.cursor/context/current-status.md` first in **Prompt 0 only**.
4. Place `Default.xls` at repo root (already there) for seed/reference during backend work.
5. After Prompt 9, run the QA checklist at the bottom.

## Product north star

| Persona | Needs |
| ------- | ----- |
| **Laundry partner (owner)** | Upload my full rate card from Excel in one shot; fix one shirt price later; hide items I don't offer; show staff a photo so they pick the right garment |
| **Counter staff** | Scan category → tap garment photo → pick service type (Dry clean / Press / Shoe clean) → price auto-fills |
| **Customer** (later slice) | See this laundry's garment list on storefront / booking |

## Excel source of truth — `Default.xls`

**Sheet `Data` — 313 rows × 15 columns**

| Column | Meaning | Example |
| ------ | ------- | ------- |
| `T_ISSHOWITEM` | `1` = visible on counter, `0` = hidden | `1` |
| `Category` | Garment group | Men, Women, Kids, Household, Institutional, Others |
| `Garment` | Display name | T Shirt, Saree |
| `GarmentCode` | Short code (unique per laundry) | TF, S, Je |
| `COMMERCIAL SERVICE` … `Wash N Iron` | Price in INR; `0` or empty = not offered | Dry Cleaning `59`, Steam Press `15` |

**Active price columns in sample file** (others stay nullable for future):

- COMMERCIAL SERVICE (13 items)
- Dry Cleaning (258)
- SHOE CLEANING (29)
- Steam Press (151)

**Design rule:** Store **all 11 service-type columns** even when zero — partners may enable them later without re-import.

## Architecture decision (locked for this feature)

| Topic | Decision | Rationale |
| ----- | -------- | --------- |
| New vs extend `laundry_services` | **New tables** `laundry_garment_items` + `laundry_garment_service_rates` | Current `laundry_services` is one name + one `price_inr`; Excel is garment × multi-service matrix |
| vs `platform_catalog_items` | **Keep both**; optional `platform_catalog_item_id` FK on garment for photo fallback | `/partner/pricing` stays marketplace garment list; this feature is **partner ops rate card** |
| Walk-in / Cloth Wall | **Slice 8 bridge** — read garment matrix first; fallback to legacy `laundry_services` | Avoid breaking existing orders |
| Images | `image_url` on garment + reuse storefront upload pattern | Partners upload; fallback to WashHouse catalog photo resolver by slug/name |
| Bulk format | Accept `.xls`, `.xlsx`, `.csv` (same headers as Default.xls) | Matches partner POS exports |
| Bulk delete | Soft-delete garments + rates; require typed confirm for "delete all" | Reversible, audit-friendly |
| Money | `NUMERIC(12,2)` INR; API exposes `price_inr` string + `price_paise` int | Match existing pricing-model |

**Hard rules:**

- Partner can only CRUD **own laundry** rows (403 otherwise).
- Import is **preview → confirm** (never silent overwrite without user ack).
- Default list **page_size = 20** with category filter + search.
- Mobile-first: card grid on ≤640px, table on desktop.
- Do **not** remove `/partner/pricing` — add cross-link "Marketplace garment prices".
- English-first copy; Hinglish labels optional in Cloth Wall bridge only.

**Already exists — extend, don’t duplicate:**

| Area | Location |
| ---- | -------- |
| Service page shell | `frontend/app/(partner)/partner/services/page.tsx`, `partner-service-catalog-view.tsx` |
| Hub modal (legacy) | `partner-hub-services-workspace.tsx` — update to deep-link or embed new catalog |
| Storefront image upload | `POST /partner/storefront/upload` — reuse or extract shared upload helper |
| Catalog photos | `frontend/features/marketing/catalog/washhouse-catalog-photos.ts`, `resolve-catalog-photo-key.ts` |
| Cloth Wall tiles | `frontend/features/partner-shop-floor/lib/cloth-wall-items.ts` |
| Partner price list | `platform_catalog_items` + `laundry_item_prices` — separate concern |
| Prompt pattern | `.cursor/prompts/partner-customers-orders-four-pillars-workspace.md` |

---

## Prompt 0 — Spec, UX & traceability (PM + UX + architects)

```
Act as product-manager + ui-ux-designer + frontend-architect + backend-architect for DLM WashHouse.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 03-folder-structure.md, 13-ui-ux.md, 16-cursor-operating-rules.md, 19-responsive-design.md, 10-accessibility.md
- .cursor/context/current-status.md
- Default.xls (repo root) — parse headers + sample rows
- docs/features/partner-price-list.md (understand separation from ops catalog)
- frontend/features/partner/views/partner-service-catalog-view.tsx
- frontend/features/partner/orders-hub/workspace/partner-hub-services-workspace.tsx
- backend/app/models/laundry.py (LaundryService)
- backend/app/services/partner_service_catalog_service.py
- frontend/features/partner-shop-floor/lib/cloth-wall-items.ts

Outcome:
Write docs/features/partner-garment-service-catalog.md from .cursor/templates/feature-spec.md

Must define:

1) Problem: Partners maintain rates in Excel/POS; current service catalog is flat one-price rows — cannot bulk import Default.xls or show garment photos at counter.

2) Data model (full column list + indexes + soft delete):
   - laundry_garment_items (laundry_id, category, name, garment_code, image_url, is_visible, sort_order, platform_catalog_item_id nullable)
   - laundry_garment_service_rates (garment_item_id, service_type enum, price_inr nullable)
   - service_type enum = 11 Excel columns (snake_case slugs)

3) API table (all endpoints + auth + pagination + import preview response shape)

4) UX wireframes (375px + 1280px):
   - Page header: title, subtitle, KPI chips (total / visible / categories)
   - Toolbar: [Bulk upload] [Download template] [Bulk delete] [Add garment]
   - Category tabs + search
   - Card grid (mobile) / table (desktop): thumbnail, name, code, price pills per service type, visibility toggle
   - Add/Edit sheet: image dropzone, fields, service-type price grid
   - Bulk upload dialog: upload → preview table (errors highlighted) → confirm import
   - Bulk delete dialog: select category / select rows / delete all (type DELETE confirm)

5) Import rules:
   - Match rows by (laundry_id, garment_code) for upsert
   - T_ISSHOWITEM → is_visible
   - Zero price → rate row absent or price null (document choice)
   - Row-level validation errors collected; partial import option

6) Relationship to laundry_services + platform catalog + Cloth Wall (bridge slice)

7) Non-goals: changing GST; admin master catalog CRUD; multi-currency

8) Phased delivery map Prompts 1–9

9) QA matrix (375 / 768 / 1280, light/dark)

Acceptance:
- Spec merged with traceability line in docs/product/traceability.md
- No code in this prompt
```

---

## Prompt 1 — Database migration + models

```
Act as database-architect + backend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md (from Prompt 0)
- backend/app/models/laundry.py
- docs/database/schema.md
- .cursor/rules/15-database-migrations.md

Implement:

1) Alembic migration (reversible):
   - Enum `garment_service_type` with 11 values matching Default.xls columns
   - Enum `garment_category` or varchar for Men/Women/Kids/Household/Institutional/Others
   - Table `laundry_garment_items` + `laundry_garment_service_rates`
   - Unique (laundry_id, garment_code) WHERE deleted_at IS NULL
   - Unique (garment_item_id, service_type) WHERE deleted_at IS NULL
   - Indexes on laundry_id, category, is_visible

2) SQLAlchemy models in backend/app/models/garment_catalog.py (or extend laundry domain)

3) Update docs/database/schema.md

4) Unit tests: uniqueness, soft delete, enum values

Acceptance:
- alembic upgrade head succeeds
- pytest for model constraints passes
- No API yet
```

---

## Prompt 2 — Backend repository + service layer

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- New models from Prompt 1
- backend/app/services/partner_service_catalog_service.py (patterns)
- backend/app/repositories/partner_service_catalog.py

Implement PartnerGarmentCatalogRepository + PartnerGarmentCatalogService:

- list_garments(laundry_id, category?, search?, page, page_size) → paginated rows with nested rates
- get_garment(laundry_id, garment_id)
- create_garment + upsert rates
- update_garment + patch rates
- delete_garment (soft)
- bulk_delete(laundry_id, ids[] | category | all) with count return
- import_preview(laundry_id, file bytes, filename) → { rows_valid[], rows_error[], summary }
- import_confirm(laundry_id, preview_token OR inline rows, mode: upsert|replace_category|replace_all)
- export_template() → bytes (generate xlsx/csv matching Default.xls headers)
- resolve_image_fallback(garment) → optional platform catalog photo key

Validation:
- garment_code required, max 20 chars, alphanumeric
- prices >= 0, max 999999.99
- at least one non-null rate OR allow all-zero with is_visible=false (document)

Acceptance:
- Service unit tests for preview parsing (use Default.xls fixture in backend/tests/fixtures/)
- Authz: partner scoped to own laundry only
```

---

## Prompt 3 — Backend API endpoints

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- PartnerGarmentCatalogService from Prompt 2
- backend/app/api/v1/endpoints/partner_service_catalog.py (replace/extend)
- .cursor/rules/05-api-standards.md, 06-error-handling.md

Implement routes under /api/v1/partner/garment-catalog:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | /garment-catalog | Paginated list ?category=&search=&page=&page_size= |
| GET | /garment-catalog/template | Download import template |
| POST | /garment-catalog/import/preview | multipart file → preview |
| POST | /garment-catalog/import | Confirm import body |
| POST | /garment-catalog | Create single garment + rates |
| GET | /garment-catalog/{id} | Detail |
| PATCH | /garment-catalog/{id} | Update |
| DELETE | /garment-catalog/{id} | Soft delete one |
| POST | /garment-catalog/bulk-delete | { ids?, category?, all?: bool, confirm?: string } |
| POST | /garment-catalog/{id}/image | multipart image upload (reuse storefront storage) |

Schemas in backend/app/schemas/garment_catalog.py

Wire router in backend/app/api/v1/router.py

Keep legacy GET/POST /partner/services working (deprecated) OR return 410 with migration message — document in OpenAPI.

Tests: backend/tests/api/test_partner_garment_catalog.py
- list pagination, CRUD, import preview with Default.xls, bulk delete authz, 403 cross-laundry

Acceptance:
- All tests green
- Postman/curl examples in docs/api/endpoints/partner-garment-catalog.md
```

---

## Prompt 4 — Frontend API client + types

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- docs/api/endpoints/partner-garment-catalog.md
- frontend/services/partner-service-catalog.ts (legacy)
- frontend/lib/query-keys.ts, frontend/lib/pagination/types.ts

Create frontend/services/partner-garment-catalog.ts:

Types:
- GarmentServiceType (11 slugs)
- GarmentCategory
- GarmentCatalogItem (id, category, name, garment_code, image_url, is_visible, rates: Record<ServiceType, price | null>, resolved_image_url?)
- ImportPreviewResult, BulkDeleteRequest

Functions:
- listPartnerGarments(params)
- downloadGarmentTemplate()
- previewGarmentImport(file)
- confirmGarmentImport(payload)
- createPartnerGarment, updatePartnerGarment, deletePartnerGarment
- bulkDeletePartnerGarments
- uploadGarmentImage(id, file)

Add queryKeys.partnerGarmentCatalog(...)

Acceptance:
- Types match API envelope
- No UI yet
```

---

## Prompt 5 — Service catalog page shell + toolbar

```
Act as frontend-architect + ui-ux-designer for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- frontend/features/partner/views/partner-service-catalog-view.tsx
- frontend/features/partner/lib/partner-nav.ts (Your shop › Service catalog → /partner/services)
- Partner ops visual patterns: PartnerOpsSurface, EmptyState, hub modals

Replace PartnerServiceCatalogView with new layout:

Route stays /partner/services

Header:
- Title: "Service catalog"
- Subtitle: "Your garment list and rates — used at the counter and in orders."
- KPI strip: total garments, visible count, categories count (from list meta or client derive)

Toolbar (data-testid on each):
- bulk-upload-btn
- download-template-btn
- bulk-delete-btn
- add-garment-btn

Category tabs: All | Men | Women | Kids | Household | Institutional | Others
Search input (debounced 300ms) on name + garment_code

Use TanStack Query listPartnerGarments with pagination (page_size=20)

Loading / error / empty states:
- Empty: "Upload your rate card" primary → opens bulk upload; secondary download template

Do NOT implement modals yet — stub onClick toasts "Coming in next prompt"

Update partner-hub-services-workspace to link "Open full catalog →" /partner/services instead of duplicating old CRUD (minimal change)

Acceptance:
- Page renders at /partner/services
- Nav active state correct
- Responsive toolbar wraps on mobile
```

---

## Prompt 6 — Garment card grid + table + single-item CRUD

```
Act as frontend-architect + ui-ux-designer for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- Prompt 5 page shell
- frontend/features/partner/components/ops-visual/partner-service-tile.tsx (visual cues)
- frontend/features/marketing/catalog/washhouse-catalog-photos.ts (fallback images)

Implement:

1) GarmentCatalogGrid (sm:hidden or grid-cols-2) — card shows:
   - Image (uploaded or fallback hero)
   - Name + garment code badge
   - Price chips: Dry clean, Press, Shoe clean (hide zero)
   - Visibility eye icon toggle
   - Edit button

2) GarmentCatalogTable (hidden sm:table) — sortable name, code, service columns (only show columns with ≥1 price in current page or user column picker)

3) GarmentFormSheet (Dialog/Sheet):
   - Image upload dropzone (reuse storefront upload endpoint pattern)
   - Category select, name, garment_code
   - Service price grid (11 inputs, collapsible "More services" for zero-heavy columns)
   - Visible toggle
   - Save / Cancel

4) Wire create + edit + delete + visibility toggle mutations with query invalidation

5) Confirm delete single item

Acceptance:
- Full single-item CRUD works E2E against API
- Image shows fallback when no upload
- a11y: labels, focus trap in sheet, keyboard close
- Jest: price chip formatter, visibility toggle handler
```

---

## Prompt 7 — Bulk upload wizard

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- Default.xls structure
- Prompt 5 toolbar bulk-upload-btn

Implement BulkUploadDialog (multi-step):

Step 1 — Upload:
- Dropzone accepts .xls .xlsx .csv
- Link "Download template"
- On file select → call previewGarmentImport

Step 2 — Preview:
- Summary: X valid, Y errors, Z updates, W new
- Table: row #, status icon, garment, code, errors[], price diff highlight for updates
- Toggle: "Skip invalid rows" vs "Cancel if any errors"
- Import mode select: Upsert by code (default) | Replace all in file categories | Replace entire catalog (danger)

Step 3 — Result:
- Success count, failed rows downloadable as CSV
- CTA "View catalog"

Use framer-motion subtle step transitions (respect prefers-reduced-motion)

Acceptance:
- Import Default.xls → 313 rows preview; confirm → list populated
- Invalid row (duplicate code, bad category) shows inline error
- data-testid: bulk-upload-dialog, import-confirm-btn
- Playwright smoke: upload fixture csv with 3 rows
```

---

## Prompt 8 — Bulk delete + hub integration + Cloth Wall bridge

```
Act as frontend-architect + backend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- partner-hub-services-workspace.tsx
- frontend/features/partner-shop-floor/lib/cloth-wall-items.ts

Part A — Bulk delete dialog:
- Modes: Selected rows (checkbox column on table) | By category | Delete entire catalog
- Delete entire catalog requires typing DELETE
- Show count before confirm

Part B — Hub pillar update:
- PartnerHubServicesPillarCard KPIs from garment catalog count
- Modal: summary + link to /partner/services (avoid maintaining two CRUD UIs)

Part C — Cloth Wall bridge (read path only):
- When partner has ≥1 garment catalog item, build ClothWallTile from garment matrix:
  - Map Dry Cleaning → dryCleanInr, Steam Press → pressInr
  - Map SHOE CLEANING → single priceInr
  - Use garment image_url or catalog photo resolver
- Fallback to existing catalog + laundry_services when garment catalog empty

Part D — Deprecate legacy:
- Mark old /partner/services CRUD endpoints deprecated in docs; keep for 1 release if orders reference laundry_service ids

Acceptance:
- Bulk delete by category removes only that category
- Cloth Wall shows imported Men shirts with correct dry clean price
- Walk-in order still works with legacy services if catalog empty
- E2E: import → open walk-in → see new garment tile
```

---

## Prompt 9 — Polish, QA matrix, docs

```
Act as qa-engineer + frontend-architect for DLM.

Read:
- docs/features/partner-garment-service-catalog.md
- All prior prompt outputs

1) Dark mode token pass on new components
2) a11y: axe on /partner/services; table headers scope; live region on import result
3) Performance: paginate; don't load 313 images at once — lazy load thumbnails
4) Add frontend/tests/e2e/partner-garment-catalog.spec.ts:
   - download template
   - upload 3-row csv
   - edit one price
   - bulk delete one category with confirm
5) Update logs/feature-progress.md, docs/product/traceability.md
6) Cross-link from /partner/pricing: "Counter rate card → Service catalog"

QA matrix checklist (manual):
| Case | 375 | 1280 | dark |
| ---- | --- | ---- | ---- |
| Empty state → upload | | | |
| Import Default.xls | | | |
| Add image on garment | | | |
| Toggle visibility | | | |
| Bulk delete category | | | |
| Hub services tile link | | | |
| Cloth Wall shows import | | | |

Acceptance:
- CI: new tests pass
- No regressions on partner-service-catalog legacy tests (update or remove)
```

---

## QA checklist (after Prompt 9)

- [ ] Partner can download template matching Default.xls columns
- [ ] Bulk upload 313 rows completes in &lt;30s locally
- [ ] Single garment CRUD + image upload works
- [ ] Bulk delete by category / selected / all (with DELETE confirm)
- [ ] Hidden garments (`T_ISSHOWITEM=0`) import as `is_visible=false`
- [ ] `/partner/pricing` still works independently
- [ ] Cloth Wall picks up imported garments when catalog non-empty
- [ ] Mobile card grid usable one-handed at 375px
- [ ] Partner A cannot delete Partner B catalog (API 403)

## File map (expected)

| Layer | Paths |
| ----- | ----- |
| Spec | `docs/features/partner-garment-service-catalog.md` |
| Migration | `backend/alembic/versions/*_laundry_garment_catalog.py` |
| Models | `backend/app/models/garment_catalog.py` |
| Service | `backend/app/services/partner_garment_catalog_service.py` |
| API | `backend/app/api/v1/endpoints/partner_garment_catalog.py` |
| FE feature | `frontend/features/partner/garment-catalog/` |
| FE view | `frontend/features/partner/views/partner-service-catalog-view.tsx` |
| FE API | `frontend/services/partner-garment-catalog.ts` |
| Tests | `backend/tests/api/test_partner_garment_catalog.py`, `frontend/tests/e2e/partner-garment-catalog.spec.ts` |
| Fixture | `backend/tests/fixtures/default_garment_catalog.xls` (copy of Default.xls) |
