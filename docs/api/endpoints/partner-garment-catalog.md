# Partner garment catalog

Partner-owned garment rate card (Default.xls matrix) for counter ops and bulk import.

**Auth:** `partner` (JWT). Laundry is resolved from the token subject — never from a client-supplied `laundry_id`.

**Base:** `/api/v1/partner/garment-catalog`

**Legacy (deprecated):** `GET|POST|PATCH|DELETE /api/v1/partner/services` — flat `laundry_services` CRUD kept for one release while walk-in orders may still reference legacy service IDs. **Use garment catalog for all new partner UI** (`/partner/services` page, bulk import, Cloth Wall read path).

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/partner/garment-catalog` | Paginated list `?category=&search=&page=&page_size=` (default 20) |
| `GET` | `/partner/garment-catalog/summary` | KPI counts: total, visible, categories |
| `GET` | `/partner/garment-catalog/template` | Download xlsx import template |
| `POST` | `/partner/garment-catalog/import/preview` | Multipart file → preview + `preview_id` |
| `POST` | `/partner/garment-catalog/import` | Confirm import from preview |
| `POST` | `/partner/garment-catalog/bulk-delete` | Delete by `ids`, `category`, or `all` + `confirm` |
| `POST` | `/partner/garment-catalog` | Create garment + rates |
| `GET` | `/partner/garment-catalog/{id}` | Detail |
| `PATCH` | `/partner/garment-catalog/{id}` | Update |
| `DELETE` | `/partner/garment-catalog/{id}` | Soft delete one |
| `POST` | `/partner/garment-catalog/{id}/image` | Upload image (max 5 MB) |

## Money

- DB: `NUMERIC(12,2)` INR per service type
- API: `rates.{service_type}.price_inr` string + `price_paise` int
- Omitted or zero price → service not offered (no rate row)

## Service types (`rates` keys)

`commercial_service`, `dry_cleaning`, `express_service`, `on_hanger`, `lint_remover`, `premium_laundry`, `shoe_cleaning`, `steam_press`, `starch`, `wash_and_fold`, `wash_n_iron`

## Import

1. `POST /import/preview` with `.xls`, `.xlsx`, or `.csv` (Default.xls headers)
2. Review `valid_rows` / `error_rows` and `summary`
3. `POST /import` with `{ "preview_id": "…", "mode": "upsert", "skip_invalid": true }`

**Modes:** `upsert` (default) · `replace_categories_in_file` · `replace_all`

Preview expires after **15 minutes**.

## Example — create garment

```json
{
  "name": "T Shirt",
  "garment_code": "TF",
  "category": "men",
  "is_visible": true,
  "rates": {
    "dry_cleaning": "59.00",
    "steam_press": "15.00"
  }
}
```

## Example — bulk delete entire catalog

```json
{
  "all": true,
  "confirm": "DELETE"
}
```

## Errors

| Code | When |
| ---- | ---- |
| `AUTH_FAILED` | Missing / invalid bearer |
| `FORBIDDEN` | Non-partner role |
| `NOT_FOUND` | No laundry for partner, unknown garment, expired preview |
| `VALIDATION_FAILED` | Bad file, duplicate code, bulk delete without DELETE confirm |

## Related

- Feature spec: [partner-garment-service-catalog.md](../../features/partner-garment-service-catalog.md)
- Marketplace compare list (separate): [partner-price-list.md](partner-price-list.md)
