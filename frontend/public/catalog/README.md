# WashHouse catalog product photos

Standalone WebP tiles cropped from the WashHouse service-catalog collage. These assets power scroll-synced rack photos on `/pricing` (and category heroes elsewhere) via local `next/image` paths — no remote domain config required.

## Unsplash migration (marketing)

`features/marketing/**` no longer references `images.unsplash.com`. The `images.unsplash.com` remote pattern in `next.config.mjs` can stay for **discover/marketplace** (`features/discover/**`) until that area is migrated.

### Gaps — no catalog equivalent

| Use case | Current fallback | Follow-up |
| -------- | ---------------- | --------- |
| Testimonial customer avatars | Name initials via `TestimonialAvatar` (`features/marketing/testimonials/testimonial-avatar.tsx`) | Real customer photos from `GET /marketing/testimonials` when CMS rows ship |

## Folder layout

| Folder | Contents |
| ------ | -------- |
| `men/` | Men's wear tiles (shirt, trouser, kurta, suit, …) |
| `women/` | Women's wear tiles (saree, lehenga, blouse, …) |
| `kids/` | Kids tiles — **placeholder crops** from men's/women's rows (no kids row in source collage yet) |
| `winter/` | Winter tiles that appear on the women's row (shawl, sweater, puffer jacket) |
| `household/` | Home-care tiles (bedsheet, blanket, curtain, …) |
| `accessories/` | Shoes, bags, soft toys, helmet |
| `services/` | Pickup, cleaning, steam-iron, packaging, … service icons |

## Naming convention

- **File:** `<category>/<short-name>.webp` — kebab-case, no category prefix in the filename (the folder is the category).
- **Manifest `slug`:** Matches platform catalog slugs where possible (`men-shirt-tshirt`, `women-saree-normal`, …).
- **Manifest `key`:** Maps to `PricingProductPhotoKey` in `features/marketing/pricing/pricing-product-images.ts` when a photo exists there (`shirt`, `saree`, `bedsheet`, …). Variant rows share the same key (e.g. both saree weights use `saree`). Keys without a pricing entry (`curtain`, `helmet`, `sofa_cover`) are catalog-only until product adds them.

## Source image

Place the master collage at:

```
public/brand/washhouse-service-catalog-source.jpeg
```

The repo may ship a copy derived from `public/WhatsApp Image 2026-07-18 at 2.09.34 PM.jpeg`. The source JPEG is large (~1–2 MB); consider adding it to `.gitignore` in a follow-up and keeping only the generated WebPs in git.

## Pricing page performance

Rack photos use a fixed **4∶3** frame (`aspect-[4/3]`, `object-cover`) so category rows share one height with no layout shift. The first in-view category alone gets `priority` / `fetchPriority="high"`; neighbors are warmed by prefetch, not eager-loaded.

### `sizes` and prefetch (keep in sync)

Defined in `features/marketing/pricing/lib/prefetch-pricing-product-image.ts` as `PRICING_CATEGORY_PHOTO_SIZES`:

```
(max-width: 1023px) calc(100vw - 2rem), (max-width: 1439px) 42vw, 580px
```

Largest rendered slot ≈ **580 px** wide (desktop). Prefetch uses the same `sizes` plus intrinsic **1200 × 900** tile masters so `getImageProps` warms the same `/_next/image` URLs the frame requests. Neighbor prefetch covers `activeIndex ± 1`, capped at two concurrent loads page-wide.

### Recommended WebP dimensions

| Role | Dimensions | Notes |
| ---- | ---------- | ----- |
| **Recommended export** | **1200 × 900** | 4∶3 product tiles; `manifest.json` → `output.targetWidth` / `targetHeight` |
| **Displayed aspect** | **4∶3** | CSS frame (`aspect-[4/3]`, `object-cover`) |
| **Prefetch / retina target** | **1200 × 900** | Matches `PRICING_PHOTO_PREFETCH_WIDTH` / `HEIGHT` and tile masters |

Collage-derived tiles are fitted onto a white 4∶3 canvas after crop. Stock tiles bypass the collage entirely (see below).

WebP quality **85** (current default) is a good balance for product tiles. AVIF/WebP delivery is handled by `next/image` — keep master files as WebP under `public/catalog/`.

## Regenerating assets

From `frontend/` (Pillow required — same as brand-asset script):

```bash
python scripts/extract-catalog-photos.py
# or
node scripts/extract-catalog-photos.mjs
```

### Import folder pipeline (manual downloads)

Drop raw JPG/PNG files into category folders under `public/catalog/_imports/` (gitignored), then run one command to produce production tiles:

```
public/catalog/_imports/
  men/
    shirt.jpg
    Trouser Jeans.png
  women/
    saree-normal.jpeg
```

```bash
cd frontend
npm run catalog:optimize
```

**What it does**

1. Reads each `public/catalog/_imports/<category>/` folder
2. Normalizes filenames to **kebab-case** (e.g. `Trouser Jeans.png` → `trouser-jeans.webp`)
3. Fits onto a **1200 × 900** white 4∶3 canvas and writes **WebP quality 85** to `public/catalog/<category>/`
4. **Skips** outputs that are already newer than the source (idempotent — safe to re-run)
5. Logs **skipped** (unsupported type, unreadable, up-to-date) and **oversized** sources (longest side > 8000 px; still processed)

**Flags**

```bash
npm run catalog:optimize -- --force              # re-encode all imports
npm run catalog:optimize -- --marketing          # also process public/marketing/_imports/
npm run catalog:optimize -- --marketing-only     # heroes only (1920×1080 WebP q82)
```

Marketing heroes land in `public/marketing/heroes/` (same dimensions as `download-marketing-heroes.py`).

Requires **Python 3 + Pillow** (same as `extract-catalog-photos.py`). The npm script is a thin Node wrapper around `scripts/optimize-catalog-imports.py`.

### Direct WebP placement (stock / custom shoot)

When a manifest row has `"source": "stock"`, the extract script **skips** it — the WebP is placed directly under `public/catalog/`.

**Batch download** from `scripts/catalog-stock-sources.json` (P0 + kids + winter placeholders):

```bash
python scripts/download-catalog-stock.py
python scripts/download-catalog-stock.py --slug men-shirt-tshirt   # single tile
```

**One-off** from a URL or local file (1200×900, white background, WebP q85):

```bash
python scripts/prepare-catalog-stock-photo.py \
  --url "https://images.pexels.com/photos/4044723/pexels-photo-4044723.jpeg" \
  --out public/catalog/men/shirt.webp
```

Then add `"source": "stock"` to the manifest row (or re-run `download-catalog-stock.py`, which patches manifest automatically). Log credits in `ATTRIBUTION.md`.

### What the extract script does

1. Reads `public/catalog/manifest.json`
2. **Skips** rows with `"source": "stock"`
3. Crops each `crop` box from the source JPEG
4. Fits onto a **1200 × 900** white 4∶3 canvas (LANCZOS)
5. Writes **WebP quality 85**

### Adjusting crops

Edit `manifest.json` — each item has pixel coordinates relative to the 1536×1024 source:

```json
{
  "key": "shirt",
  "slug": "men-shirt-tshirt",
  "label": "Shirt / T-shirt",
  "category": "men",
  "file": "men/shirt.webp",
  "crop": { "x": 15, "y": 310, "w": 110, "h": 110 }
}
```

Most rows use a 120 px horizontal step from `x = 15`. The home-care / accessories row has a few hand-tuned boxes where tiles sit between grid columns (pillow cover, school bag, handbag, helmet).

After editing, re-run the script and spot-check a few tiles in each category.

## Manifest fields

| Field | Purpose |
| ----- | ------- |
| `key` | `PricingProductPhotoKey` or catalog-only identifier |
| `slug` | Platform catalog slug (for future wiring) |
| `label` | Human label from the collage |
| `category` | Output subfolder |
| `file` | Relative path under `public/catalog/` |
| `crop` | `{ x, y, w, h }` source pixels (omit when `source: "stock"`) |
| `source` | `"stock"` — skip collage extract; WebP placed directly |
| `placeholder` | Optional `true` when crop is inherited from another slug (see coverage table) |
| `cropFrom` | Source slug the placeholder crop was copied from |
| `note` | Human note for manual crop follow-up |

Regenerate the coverage tables after manifest edits:

```bash
python scripts/_gen-catalog-readme-coverage.py
```

## Related code

- Photo key map: `features/marketing/pricing/pricing-product-images.ts`
- Prefetch + `sizes`: `features/marketing/pricing/lib/prefetch-pricing-product-image.ts`
- Platform catalog slugs: `backend/app/db/seed_washhouse_catalog.py`

## Coverage (auto-generated)

Last aligned with `seed_washhouse_catalog.py`, `pricing-product-images.ts`, `special-care-items.ts`, and `services-data.ts`.

### Manifest `key` vs `PRICING_PRODUCT_PHOTOS`

| Key | In manifest | In pricing | Notes |
| --- | --- | --- | --- |
| `bag` | yes | — | Catalog-only (not in pricing map yet) |
| `bathrobe` | yes | — | Catalog-only (not in pricing map yet) |
| `bedsheet` | yes | — | Catalog-only (not in pricing map yet) |
| `blanket` | yes | — | Catalog-only (not in pricing map yet) |
| `blouse` | yes | — | Catalog-only (not in pricing map yet) |
| `cap` | yes | — | Catalog-only (not in pricing map yet) |
| `carpet` | yes | — | Catalog-only (not in pricing map yet) |
| `coat` | yes | — | Catalog-only (not in pricing map yet) |
| `comforter` | yes | — | Catalog-only (not in pricing map yet) |
| `curtain` | yes | — | Catalog-only (not in pricing map yet) |
| `dhoti` | yes | — | Catalog-only (not in pricing map yet) |
| `dress` | yes | — | Catalog-only (not in pricing map yet) |
| `dupatta` | yes | — | Catalog-only (not in pricing map yet) |
| `frock` | yes | — | Catalog-only (not in pricing map yet) |
| `girl_dress` | yes | — | Catalog-only (not in pricing map yet) |
| `gloves` | yes | — | Catalog-only (not in pricing map yet) |
| `gown` | yes | — | Catalog-only (not in pricing map yet) |
| `hanky` | yes | — | Catalog-only (not in pricing map yet) |
| `heels` | yes | — | Catalog-only (not in pricing map yet) |
| `helmet` | yes | — | Catalog-only (not in pricing map yet) |
| `hoodie` | yes | — | Catalog-only (not in pricing map yet) |
| `jacket_denim` | yes | — | Catalog-only (not in pricing map yet) |
| `jacket_leather` | yes | — | Catalog-only (not in pricing map yet) |
| `jacket_puffer` | yes | — | Catalog-only (not in pricing map yet) |
| `jogger` | yes | — | Catalog-only (not in pricing map yet) |
| `kurta` | yes | — | Catalog-only (not in pricing map yet) |
| `lehenga` | yes | — | Catalog-only (not in pricing map yet) |
| `lower` | yes | — | Catalog-only (not in pricing map yet) |
| `overcoat` | yes | — | Catalog-only (not in pricing map yet) |
| `overcoat_leather` | yes | — | Catalog-only (not in pricing map yet) |
| `pillow` | yes | — | Catalog-only (not in pricing map yet) |
| `purse` | yes | — | Catalog-only (not in pricing map yet) |
| `saree` | yes | — | Catalog-only (not in pricing map yet) |
| `shawl` | yes | — | Catalog-only (not in pricing map yet) |
| `sherwani` | yes | — | Catalog-only (not in pricing map yet) |
| `shirt` | yes | — | Catalog-only (not in pricing map yet) |
| `shoes` | yes | — | Catalog-only (not in pricing map yet) |
| `shorts` | yes | — | Catalog-only (not in pricing map yet) |
| `skirt` | yes | — | Catalog-only (not in pricing map yet) |
| `sofa_cover` | yes | — | Catalog-only (not in pricing map yet) |
| `suit` | yes | — | Catalog-only (not in pricing map yet) |
| `sweater` | yes | — | Catalog-only (not in pricing map yet) |
| `tie` | yes | — | Catalog-only (not in pricing map yet) |
| `top` | yes | — | Catalog-only (not in pricing map yet) |
| `towel` | yes | — | Catalog-only (not in pricing map yet) |
| `toy` | yes | — | Catalog-only (not in pricing map yet) |
| `trolley` | yes | — | Catalog-only (not in pricing map yet) |
| `trouser` | yes | — | Catalog-only (not in pricing map yet) |
| `vest` | yes | — | Catalog-only (not in pricing map yet) |
| `wallet` | yes | — | Catalog-only (not in pricing map yet) |
| `wash_fold` | yes | — | Catalog-only (not in pricing map yet) |
| `wash_iron` | yes | — | Catalog-only (not in pricing map yet) |

### `SPECIAL_CARE_ITEMS` -> catalog

| Marketing slug | Label | Catalog slug | Tile | Notes |
| --- | --- | --- | --- | --- |
| `wedding-sherwani` | Wedding / Sherwani | `men-sherwani-wedding` | source | Wedding sherwani tile |
| `lehengas` | Lehengas | `women-lehenga-normal` | stock |  |
| `sarees` | Sarees | `women-saree-normal` | stock |  |
| `suits` | Suits | `men-suit-2pcs` | stock |  |
| `leather-jackets` | Leather Jackets | `winter-jacket-leather` | stock | Placeholder coat crop |
| `shoes` | Shoes | `household-shoes-sports` | stock |  |
| `curtains` | Curtains | `household-curtain-panel` | source |  |
| `blankets` | Blankets | `household-blanket-double` | stock |  |
| `soft-toys` | Soft Toys | `household-toy-m` | source |  |

### `SERVICE_PREVIEW_ITEMS` -> catalog

| Marketing slug | Title | Catalog slug | Tile | Notes |
| --- | --- | --- | --- | --- |
| `wash-fold` | Wash & Fold | `kg-wash-fold` | stock |  |
| `wash-iron` | Wash & Iron | `kg-wash-iron` | stock |  |
| `premium-laundry` | Premium Laundry | `service-professional-cleaning` | source | Marketing-only service slug |
| `dry-clean` | Dry Cleaning | `men-suit-2pcs` | stock | Marketing-only — suit tile as stand-in |
| `shoe-cleaning` | Shoe Cleaning | `household-shoes-sports` | stock |  |
| `curtain-cleaning` | Curtain Cleaning | `household-curtain-panel` | source |  |
| `more-services` | More Services | `service-on-time-delivery` | source | Marketing-only catch-all |

### Platform seed slugs (`seed_washhouse_catalog.py`)

- **110** seed slugs — **110** in manifest (**58** stock, **33** collage crops, **19** placeholders)

| Slug | `key` | Tile | `cropFrom` / note |
| --- | --- | --- | --- |
| `household-bag-large` | `bag` | source | — |
| `household-bag-small` | `bag` | source | — |
| `household-bath-towel` | `towel` | source | — |
| `household-bedsheet-double` | `bedsheet` | stock | — |
| `household-bedsheet-single` | `bedsheet` | stock | — |
| `household-blanket-4x6` | `blanket` | stock | — |
| `household-blanket-double` | `blanket` | stock | — |
| `household-blanket-king` | `blanket` | stock | — |
| `household-carpet-l` | `carpet` | placeholder | household-carpet-m |
| `household-carpet-m` | `carpet` | source | — |
| `household-carpet-s` | `carpet` | placeholder | household-carpet-m |
| `household-comforter-double` | `comforter` | stock | — |
| `household-comforter-single` | `comforter` | stock | — |
| `household-curtain-panel` | `curtain` | source | — |
| `household-gloves-cotton` | `gloves` | stock | — |
| `household-gloves-leather` | `gloves` | stock | — |
| `household-heels` | `heels` | stock | — |
| `household-pillow-cushion-cover` | `pillow` | placeholder | household-pillow-cover; Aligns seed slug (was manifest-only household-pillow-cover) |
| `household-shoes-leather` | `shoes` | stock | — |
| `household-shoes-sports` | `shoes` | stock | — |
| `household-toy-l` | `toy` | placeholder | household-toy-m |
| `household-toy-m` | `toy` | source | — |
| `household-toy-s` | `toy` | placeholder | household-toy-m |
| `household-trolley-l` | `trolley` | stock | — |
| `household-trolley-m` | `trolley` | stock | — |
| `household-trolley-s` | `trolley` | stock | — |
| `kg-wash-fold` | `wash_fold` | stock | — |
| `kg-wash-iron` | `wash_iron` | stock | — |
| `kids-coat-formal` | `coat` | stock | — |
| `kids-coat-heavy` | `coat` | stock | — |
| `kids-dhoti-lungi` | `dhoti` | stock | — |
| `kids-dupatta` | `dupatta` | stock | — |
| `kids-frock` | `frock` | stock | — |
| `kids-full-jacket-leather` | `jacket_leather` | stock | — |
| `kids-full-jacket-normal` | `jacket_denim` | stock | — |
| `kids-girl-dress` | `girl_dress` | stock | — |
| `kids-half-jacket-leather` | `jacket_leather` | stock | — |
| `kids-half-jacket-normal` | `jacket_denim` | stock | — |
| `kids-jogger-cargo` | `jogger` | stock | — |
| `kids-kurta` | `kurta` | stock | — |
| `kids-lower` | `lower` | stock | — |
| `kids-sherwani-cotton` | `sherwani` | stock | — |
| `kids-sherwani-wedding` | `sherwani` | stock | — |
| `kids-shirt-tshirt` | `shirt` | stock | — |
| `kids-shorts` | `shorts` | stock | — |
| `kids-skirt` | `skirt` | stock | — |
| `kids-suit-2pcs` | `suit` | stock | — |
| `kids-suit-3pcs` | `suit` | stock | — |
| `kids-trouser-jeans` | `trouser` | stock | — |
| `kids-waistcoat` | `vest` | stock | — |
| `men-cap-fabric` | `cap` | source | — |
| `men-cap-leather` | `cap` | source | — |
| `men-coat-formal` | `coat` | source | — |
| `men-coat-heavy` | `coat` | source | — |
| `men-dhoti-lungi` | `dhoti` | source | — |
| `men-hanky` | `hanky` | source | — |
| `men-jogger-cargo` | `jogger` | source | — |
| `men-kurta` | `kurta` | stock | — |
| `men-lower` | `lower` | source | — |
| `men-sherwani-cotton` | `sherwani` | source | — |
| `men-sherwani-wedding` | `sherwani` | source | — |
| `men-shirt-tshirt` | `shirt` | stock | — |
| `men-shorts` | `shorts` | source | — |
| `men-suit-2pcs` | `suit` | stock | — |
| `men-suit-3pcs` | `suit` | source | — |
| `men-tie` | `tie` | source | — |
| `men-trouser-jeans` | `trouser` | stock | — |
| `men-turban` | `cap` | source | — |
| `men-vest` | `vest` | source | — |
| `men-waistcoat` | `vest` | source | — |
| `men-wallet` | `wallet` | source | — |
| `winter-cap` | `cap` | stock | — |
| `winter-half-jacket-cotton-denim` | `jacket_denim` | stock | — |
| `winter-half-jacket-leather` | `jacket_leather` | stock | — |
| `winter-half-jacket-puffer` | `jacket_puffer` | stock | — |
| `winter-hoodie` | `hoodie` | stock | — |
| `winter-jacket-cotton-denim` | `jacket_denim` | stock | — |
| `winter-jacket-leather` | `jacket_leather` | stock | — |
| `winter-jacket-puffer` | `jacket_puffer` | source | — |
| `winter-overcoat-kids` | `overcoat` | stock | — |
| `winter-overcoat-leather` | `overcoat_leather` | stock | — |
| `winter-overcoat-men-women` | `overcoat` | stock | — |
| `winter-shawl` | `shawl` | source | — |
| `winter-sweater-kids` | `sweater` | stock | — |
| `winter-sweater-men-women` | `sweater` | source | — |
| `women-bathrobe` | `bathrobe` | placeholder | household-bath-towel; No bathrobe tile — reuses towel crop |
| `women-blouse-choli-heavy` | `blouse` | stock | — |
| `women-blouse-choli-normal` | `blouse` | stock | — |
| `women-burkha` | `gown` | placeholder | women-gown-anarkali |
| `women-dupatta` | `dupatta` | source | — |
| `women-frock-heavy` | `frock` | placeholder | women-lehenga-heavy; No frock tile — reuses lehenga crop |
| `women-frock-normal` | `frock` | placeholder | women-gown-anarkali; No frock tile — reuses gown crop |
| `women-full-dress-normal` | `dress` | placeholder | women-gown-anarkali |
| `women-full-dress-party` | `dress` | placeholder | women-gown-anarkali |
| `women-gown-anarkali` | `gown` | source | — |
| `women-kameez-fancy` | `top` | placeholder | women-top-kurti |
| `women-kameez-normal` | `top` | placeholder | women-top-kurti |
| `women-kurta` | `kurta` | placeholder | women-top-kurti |
| `women-lehenga-heavy` | `lehenga` | source | — |
| `women-lehenga-normal` | `lehenga` | stock | — |
| `women-patiala-salwar` | `lower` | source | — |
| `women-petticoat` | `skirt` | placeholder | women-patiala-salwar |
| `women-purse-l` | `purse` | placeholder | women-purse-m |
| `women-purse-m` | `purse` | source | — |
| `women-purse-s` | `purse` | placeholder | women-purse-m |
| `women-saree-heavy` | `saree` | source | — |
| `women-saree-normal` | `saree` | stock | — |
| `women-skirt-long` | `skirt` | placeholder | women-top-kurti; No skirt tile — reuses top/kurti crop until collage updated |
| `women-skirt-short` | `skirt` | placeholder | women-top-kurti; No skirt tile — reuses top/kurti crop until collage updated |
| `women-top-kurti` | `top` | source | — |

### Manifest-only slugs (not in seed)

| Slug | `key` | Purpose |
| --- | --- | --- |
| `accessories-helmet` | `helmet` | Collage tile — not a priced catalog row |
| `household-pillow` | `pillow` | Legacy slug; seed uses `household-pillow-cushion-cover` |
| `household-pillow-cover` | `pillow` | Alias crop for pillow cover tile |
| `household-sofa-cover` | `sofa_cover` | Collage tile — not in seed yet |
| `service-hygienic-safe` | `wash_iron` | Homepage service icon |
| `service-on-time-delivery` | `wash_fold` | Homepage service icon |
| `service-pickup-delivery` | `wash_fold` | Homepage service icon |
| `service-professional-cleaning` | `wash_fold` | Homepage service icon |
| `service-quality-check` | `shirt` | Homepage service icon |
| `service-safe-packaging` | `bag` | Homepage service icon |
| `service-steam-ironing` | `wash_iron` | Homepage service icon |

### Manual crop follow-ups

**19** manifest rows use `placeholder: true` (inherited crops). Kids and winter placeholders are stock tiles now; remaining gaps: skirts/frocks, heels/trolleys/gloves.

| Slug | Inherits from | Note |
| --- | --- | --- |
| `women-skirt-short` | `women-top-kurti` | No skirt tile — reuses top/kurti crop until collage updated |
| `women-skirt-long` | `women-top-kurti` | No skirt tile — reuses top/kurti crop until collage updated |
| `women-full-dress-normal` | `women-gown-anarkali` |  |
| `women-full-dress-party` | `women-gown-anarkali` |  |
| `women-frock-normal` | `women-gown-anarkali` | No frock tile — reuses gown crop |
| `women-frock-heavy` | `women-lehenga-heavy` | No frock tile — reuses lehenga crop |
| `women-petticoat` | `women-patiala-salwar` |  |
| `women-kameez-normal` | `women-top-kurti` |  |
| `women-kameez-fancy` | `women-top-kurti` |  |
| `women-burkha` | `women-gown-anarkali` |  |
| `women-kurta` | `women-top-kurti` |  |
| `women-bathrobe` | `household-bath-towel` | No bathrobe tile — reuses towel crop |
| `women-purse-s` | `women-purse-m` |  |
| `women-purse-l` | `women-purse-m` |  |
| `household-toy-s` | `household-toy-m` |  |
| `household-toy-l` | `household-toy-m` |  |
| `household-pillow-cushion-cover` | `household-pillow-cover` | Aligns seed slug (was manifest-only household-pillow-cover) |
| `household-carpet-s` | `household-carpet-m` |  |
| `household-carpet-l` | `household-carpet-m` |  |
