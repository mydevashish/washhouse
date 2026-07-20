# WashHouse image style guide & stock sourcing plan

> **Owners:** UI/UX + Product  
> **Last updated:** 2026-07-20  
> **Code refs:** `pricing-product-images.ts`, `washhouse-catalog-photos.ts`, `public/catalog/`

This document defines how we source, crop, export, and attribute images so marketing pages look professional, cohesive, and culturally appropriate for the India market.

---

## 1. Style guide

### Brand intent

WashHouse imagery should feel **clean, trustworthy, and modern Indian urban/suburban** — not clip-art, not overly Western stock, not cartoon icons. Product tiles read as a **catalog rack**; heroes read as **real laundry care context**.

### Image roles

| Role | Aspect | Min export | Background | Subject | Shadow |
| ---- | ------ | ---------- | ---------- | ------- | ------ |
| **Product tile** | **4∶3** | **1200 × 900** WebP | `#FFFFFF` or `#F8F8F8` | Single garment/item, centered, 70–85% frame height | Optional soft drop shadow (`0 8px 24px rgba(0,0,0,0.08)`) |
| **Category hero** (pricing rack) | 4∶3 | 1200 × 900 | Same as tile | Best representative item for category | Same |
| **Marketing hero** | **16∶9** or **3∶2** | **1920 px** wide | In-scene (store, laundry room) | Lifestyle: folded stacks, hangers, washers, delivery | Natural scene lighting |
| **Service card** | 4∶3 | 1200 × 900 | Tile rules | **Unique image per service** — no duplicate `src` across `SERVICE_PREVIEW_ITEMS` | Optional |
| **Decorative banner** | 16∶9+ | 1920 × 1080 | In-scene | Full-bleed behind scrim; `alt=""` + `aria-hidden` in UI | N/A |

### Product tile — composition rules

1. **One primary item** per tile (variant slugs share one key — e.g. both saree weights use `saree`).
2. **Flat lay or hanger** on neutral background; no busy patterns behind the garment.
3. **Consistent color temperature** within a category row (all men's wear warm-neutral, all household cool-neutral).
4. **No watermarks, logos, or price tags** in frame.
5. **Indian garments** (saree, kurta, sherwani, lehenga, dhoti, dupatta) must look **culturally authentic** — correct drape, fabric weight, and styling. Prefer custom shoot or India-based stock over generic Western "ethnic" props.
6. **No clip-art, line icons, or cartoon illustrations** for product tiles or service cards.

### Hero — composition rules

1. **Lifestyle context:** laundromat interior, pressed shirts on hangers, folded stacks, doorstep pickup bags.
2. **Indian urban/suburban feel** where appropriate: apartment laundry corners, local storefront signage (generic), modest interiors — not luxury hotel-only aesthetics.
3. Leave **safe zones** for gradient scrims (top/bottom 20% may be darkened in UI).
4. Min **1920 px** width; export WebP quality **85**.

### Technical export

| Setting | Value |
| ------- | ----- |
| Format | WebP (masters in repo); AVIF via `next/image` |
| Tile dimensions | **1200 × 900** (4∶3) — replaces legacy 800 × 800 collage crops |
| Hero dimensions | **1920 × 1080** (16∶9) or **1920 × 1280** (3∶2) |
| Quality | 85 |
| Color profile | sRGB |
| Path pattern | `/catalog/{category}/{kebab-name}.webp` |

Prefetch/retina targets in code: `PRICING_PHOTO_PREFETCH_WIDTH` = 1160, height = 870 (`prefetch-pricing-product-image.ts`). Exporting at 1200 × 900 avoids upscale on 2× displays.

### Alt text patterns

| Context | Pattern | Example |
| ------- | ------- | ------- |
| **Product tile** | `[Garment/service] — WashHouse laundry catalog` | `Men's cotton kurta — WashHouse laundry catalog` |
| **Care context** (preferred in code today) | Descriptive sentence ending with care outcome | `Women's embroidered saree after gentle dry cleaning and press` |
| **Service card (indirect photo)** | `[Service title] — [photo alt]` | `Premium laundry — Women's lehenga skirt and jacket after dry clean and press` |
| **Marketing hero** | Descriptive scene (visible to screen readers) | `Modern WashHouse laundry store interior with commercial washers and seating` |
| **Decorative banner** | Empty alt in markup (`alt=""`, `aria-hidden`) — text lives in overlay |

When adding new tiles, update `CATALOG_PHOTO_ALTS` in `washhouse-catalog-photos.ts` to match the care-context pattern; append `— WashHouse laundry catalog` only if the sentence does not already imply WashHouse.

### Service card uniqueness

`SERVICE_PREVIEW_ITEMS` (`services-data.ts`) must not reuse the same `image` path for two cards. Current mapping:

| Service | Photo key | Notes |
| ------- | --------- | ----- |
| Wash & Fold | `wash_fold` | Dedicated service tile |
| Wash & Iron | `wash_iron` | Dedicated service tile |
| Premium Laundry | `lehenga` | Garment stand-in — OK |
| Dry Cleaning | `suit` | Garment stand-in — OK |
| Shoe Cleaning | `shoes` | OK |
| Curtain Cleaning | `curtain` (supplemental) | OK |
| More Services | `pickup_delivery` (supplemental) | OK |

Future service tiles (`services/*.webp`) should replace garment stand-ins where a literal service shot reads clearer.

### QA checklist (per asset)

- [ ] 4∶3 (tile) or 16∶9/3∶2 (hero) with no accidental letterboxing
- [ ] Background `#FFF` or `#F8F8F8` (tiles)
- [ ] File size &lt; 150 KB per tile, &lt; 400 KB per hero (target)
- [ ] Visually matches siblings in same category row (temperature, lighting)
- [ ] Alt text updated in `washhouse-catalog-photos.ts`
- [ ] Attribution row added to `public/catalog/ATTRIBUTION.md` if stock
- [ ] `manifest.json` updated if using extract script workflow

---

## 2. Sourcing matrix

**49 `PricingProductPhotoKey` values** — one row per canonical tile. Variant catalog slugs inherit these keys (see `public/catalog/README.md` coverage tables).

**Source legend**

| Source | When to use |
| ------ | ----------- |
| **Collage** | Keep/regenerate from `washhouse-service-catalog-source.jpeg` via extract script |
| **Custom shoot** | Indian ethnic wear, brand-owned store shots, hero lifestyle |
| **Unsplash** | Generic garments, household, lifestyle heroes (verify license) |
| **Pexels** | Same as Unsplash; good for laundry/interior B-roll |
| **Pixabay** | Fallback only — check license per asset |

**Placeholder column:** whether sharing this crop with variant slugs is acceptable **short-term** (Phase 0). `No` = prioritize unique asset in next sprint.

### Services & laundry-by-kg

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `wash_fold` | `services/wash-fold.webp` | `folded laundry stack white background`, `wash and fold flat lay`, `neatly folded clothes laundry` | Custom shoot or Pexels | **No** — currently inherits pickup-delivery crop |
| `wash_iron` | `services/wash-iron.webp` | `pressed shirts stack laundry`, `steam iron clothes flat lay`, `freshly ironed shirts folded` | Custom shoot or Unsplash | **No** — currently inherits steam-iron service crop |

### Men's wear

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `shirt` | `men/shirt.webp` | `white dress shirt hanger`, `pressed men's shirt flat lay laundry` | Unsplash / Collage | Yes (kids shirt variants) |
| `trouser` | `men/trouser.webp` | `folded men's trousers flat lay`, `jeans folded laundry white background` | Unsplash / Collage | Yes |
| `shorts` | `men/shorts.webp` | `men's shorts folded flat lay`, `casual shorts laundry` | Unsplash / Collage | Yes |
| `lower` | `men/lower.webp` | `men's lounge pants folded`, `track pants flat lay white` | Unsplash / Collage | Yes |
| `jogger` | `men/jogger.webp` | `joggers cargo pants flat lay`, `men's jogger folded laundry` | Unsplash / Collage | Yes |
| `kurta` | `men/kurta.webp` | `indian men's cotton kurta flat lay`, `kurta pyjama folded laundry`, `men kurta hanger neutral background` | **Custom shoot** or India stock | Yes — must look Indian, not tunic-generic |
| `dhoti` | `men/dhoti.webp` | `cotton dhoti folded india`, `dhoti lungi laundry flat lay`, `traditional dhoti white cream` | **Custom shoot** | Yes |
| `sherwani` | `men/sherwani-cotton.webp` | `indian sherwani garment`, `wedding sherwani dry clean hanger`, `men sherwani cream gold` | **Custom shoot** | Yes — wedding variant shares key |
| `coat` | `men/coat-formal.webp` | `men's formal overcoat hanger`, `wool coat dry cleaning` | Unsplash / Collage | **No** for winter overcoat slugs — coat misused as overcoat |
| `suit` | `men/suit-2pcs.webp` | `men's suit hanger`, `two piece suit dry cleaning`, `formal suit pressed` | Unsplash / Collage | Yes |
| `vest` | `men/vest.webp` | `men's waistcoat vest flat lay`, `formal vest dry clean` | Unsplash / Collage | Yes |
| `tie` | `men/tie.webp` | `silk ties arranged flat lay`, `necktie dry cleaning` | Unsplash / Collage | Yes |
| `cap` | `men/cap-fabric.webp` | `fabric cap flat lay`, `men's cap laundry` | Collage | Yes (winter cap, turban slugs) |
| `wallet` | `men/wallet.webp` | `leather wallet product white background`, `men's wallet flat lay` | Unsplash | Yes |
| `hanky` | `men/hanky.webp` | `cotton handkerchiefs stack`, `folded handkerchiefs white` | Unsplash / Collage | Yes |

### Women's wear

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `saree` | `women/saree-normal.webp` | `indian saree folded flat lay`, `silk saree dry cleaning`, `saree pleated neutral background` | **Custom shoot** | Yes (heavy/normal share) |
| `lehenga` | `women/lehenga-normal.webp` | `indian lehenga skirt choli`, `bridal lehenga garment flat lay`, `lehenga dry cleaning` | **Custom shoot** | Yes |
| `blouse` | `women/blouse-choli.webp` | `saree blouse choli flat lay`, `indian women's blouse dry clean` | **Custom shoot** or India stock | Yes (heavy variant) |
| `gown` | `women/gown.webp` | `evening gown hanger`, `anarkali dress flat lay`, `formal gown dry cleaning` | Unsplash | Yes (burkha, dress slugs) |
| `skirt` | `women/skirt-short.webp` | `women's skirt flat lay white background`, `pleated skirt laundry` | Unsplash | **No** — currently reuses top/kurti crop |
| `dress` | `women/full-dress-normal.webp` | `women's dress hanger`, `full dress dry cleaning flat lay` | Unsplash | Yes (party variant) |
| `top` | `women/top-kurti.webp` | `indian kurti top flat lay`, `women's kurti folded laundry`, `kameez top neutral background` | **Custom shoot** or India stock | Yes (kameez, kurta slugs) |
| `dupatta` | `women/dupatta.webp` | `dupatta scarf folded`, `light dupatta dry clean flat lay`, `indian dupatta fabric` | **Custom shoot** | Yes |
| `frock` | `women/frock-normal.webp` | `girls frock dress flat lay`, `women's frock laundry` | Unsplash | **No** — reuses gown/lehenga crops |
| `purse` | `accessories/handbag.webp` | `women's handbag white background`, `purse cleaning flat lay` | Unsplash / Collage | Yes (S/M/L purse slugs) |
| `bathrobe` | `women/bathrobe.webp` | `bathrobe folded white`, `soft robe laundry flat lay` | Unsplash | **No** — currently reuses towel crop |

### Kids

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `girl_dress` | `kids/girl-dress.webp` | `girls dress kids flat lay`, `children's party dress laundry` | Unsplash or **custom shoot** | **No** — kids row absent; inherits women's gown |

### Winter

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `sweater` | `winter/sweater.webp` | `knit sweater folded flat lay`, `wool sweater laundry` | Unsplash / Collage | Yes (kids sweater) |
| `overcoat` | `winter/overcoat-men-women.webp` | `winter overcoat hanger`, `long wool coat dry cleaning` | Unsplash | **No** — currently men's coat crop |
| `overcoat_leather` | `winter/overcoat-leather.webp` | `leather overcoat hanger`, `leather coat specialist cleaning` | Unsplash | **No** — coat placeholder |
| `jacket_denim` | `winter/jacket-cotton-denim.webp` | `denim jacket hanger`, `cotton jacket dry clean` | Unsplash | **No** — coat/puffer placeholders today |
| `jacket_puffer` | `winter/jacket-puffer.webp` | `puffer jacket quilted hanger`, `winter puffer dry cleaning` | Unsplash / Collage | Yes (half-jacket variants) |
| `jacket_leather` | `winter/jacket-leather.webp` | `leather jacket flat lay`, `biker jacket dry cleaning` | Unsplash | **No** — coat placeholder |
| `hoodie` | `winter/hoodie.webp` | `hoodie sweatshirt folded`, `hooded sweater laundry flat lay` | Unsplash | **No** — sweater placeholder |
| `shawl` | `winter/shawl.webp` | `wool shawl folded india`, `pashmina shawl flat lay`, `winter shawl dry clean` | **Custom shoot** or India stock | Yes |

### Household

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `bedsheet` | `household/bedsheet.webp` | `white bedsheets folded stack`, `crisp bedsheet laundry flat lay` | Unsplash / Collage | Yes (double/single variants) |
| `blanket` | `household/blanket.webp` | `folded blanket stack`, `wool blanket laundry white background` | Unsplash / Collage | Yes (size variants) |
| `comforter` | `household/comforter.webp` | `duvet comforter folded`, `comforter cleaning flat lay` | Unsplash / Collage | Yes (single variant) |
| `pillow` | `household/pillow.webp` | `pillow cushion cover folded`, `bed pillow cases stack laundry` | Unsplash / Collage | Yes (cushion cover slug) |
| `carpet` | `household/carpet.webp` | `area rug rolled carpet cleaning`, `carpet flat lay neutral` | Unsplash | Yes (S/M/L variants) |
| `towel` | `household/towel.webp` | `bath towels folded stack white`, `fluffy towels laundry` | Unsplash / Collage | Yes |

### Accessories & footwear

| Key | File | Search keywords | Preferred source | Placeholder OK? |
| --- | ---- | --------------- | ---------------- | --------------- |
| `shoes` | `accessories/shoes.webp` | `sneakers white background cleaning`, `sports shoes laundry service` | Unsplash / Collage | Yes (leather shoe variant) |
| `heels` | `accessories/heels.webp` | `women's heels white background`, `high heel shoes cleaning flat lay` | Unsplash | **No** — sports shoe placeholder |
| `bag` | `accessories/backpack.webp` | `backpack white background`, `travel bag cleaning` | Unsplash / Collage | Yes |
| `trolley` | `accessories/trolley-s.webp` | `rolling luggage suitcase white background`, `trolley bag cleaning` | Unsplash | **No** — backpack placeholder |
| `toy` | `accessories/toy.webp` | `stuffed toy plush cleaning`, `soft toy laundry gentle` | Unsplash / Collage | Yes (S/M/L variants) |
| `gloves` | `accessories/gloves-cotton.webp` | `cotton gloves pair flat lay`, `winter gloves cleaning` | Unsplash | **No** — towel/cap placeholders |

### Sourcing priority (product backlog)

| Priority | Keys | Reason |
| -------- | ---- | ------ |
| **P0** | `wash_fold`, `wash_iron`, `saree`, `kurta`, `sherwani`, `lehenga`, `dupatta` | Brand + India market credibility |
| **P1** | `skirt`, `frock`, `girl_dress`, `heels`, `trolley`, `gloves`, `bathrobe` | Wrong placeholder crop today |
| **P2** | `overcoat`, `overcoat_leather`, `jacket_denim`, `jacket_leather`, `hoodie` | Winter row cohesion |
| **P3** | Remaining keys | Collage adequate; swap to stock/shoot when batching exports |

---

## 3. Licensing

See **`frontend/public/catalog/ATTRIBUTION.md`** for the live attribution log.

### Approved free sources

| Source | License | Requirements |
| ------ | ------- | ------------ |
| [Unsplash](https://unsplash.com/license) | Unsplash License | Free commercial use; no endorsement implied; attribution appreciated |
| [Pexels](https://www.pexels.com/license/) | Pexels License | Free commercial use; no attribution required (log anyway) |
| [Pixabay](https://pixabay.com/service/license-summary/) | Pixabay Content License | Verify no recognizable trademarks; log contributor |
| **Custom shoot** | Work-for-hire / owned | Model + location releases on file |
| **Collage (owned)** | Internal derivative | Source JPEG is brand-owned reference art |

### Avoid

| Source / type | Why |
| ------------- | --- |
| Google Images / random blogs | Unknown license |
| Shutterstock / Getty watermarked previews | Not licensed |
| Clip-art, Flaticon, Noun Project **for product tiles** | Off-brand; reads cheap |
| AI-generated garments with distorted weave/drape | Trust risk; especially ethnic wear |
| Western-only "ethnic costume" stock | Culturally off for India market |
| Images with visible competitor logos or store names | Legal + brand conflict |
| CC-BY-NC (non-commercial) | Incompatible with commercial product |

### Attribution workflow

1. Download highest resolution; note photographer, URL, date.
2. Add row to `ATTRIBUTION.md` before merging asset.
3. Crop to 4∶3 or hero aspect per this guide; export WebP.
4. Drop file in correct `public/catalog/{category}/` path.
5. Update `manifest.json` if using extract pipeline, or replace file directly.
6. Update `CATALOG_PHOTO_ALTS` if alt text changes.

---

## 4. Folder layout

```
frontend/public/
├── brand/
│   └── washhouse-service-catalog-source.jpeg   # Master collage (optional in git)
└── catalog/
    ├── ATTRIBUTION.md                          # Stock photo credits (this template)
    ├── README.md                               # Technical pipeline docs
    ├── manifest.json                           # Crop boxes for extract script
    ├── heroes/
    │   ├── fresh-laundry.webp                  # 16∶9 lifestyle hero
    │   └── store-interior.webp                 # 16∶9 store hero
    ├── services/
    │   ├── wash-fold.webp
    │   ├── wash-iron.webp
    │   ├── pickup-delivery.webp
    │   ├── on-time-delivery.webp
    │   └── …                                   # One file per service icon
    ├── men/
    │   ├── shirt.webp
    │   ├── kurta.webp
    │   └── …
    ├── women/
    │   ├── saree-normal.webp
    │   ├── lehenga-normal.webp
    │   └── …
    ├── kids/
    │   ├── girl-dress.webp
    │   └── …                                   # Prefer kid-sized shoots over men's placeholders
    ├── winter/
    │   ├── jacket-puffer.webp
    │   ├── shawl.webp
    │   └── …
    ├── household/
    │   ├── bedsheet.webp
    │   ├── curtain.webp
    │   └── …
    └── accessories/
        ├── shoes.webp
        ├── heels.webp
        └── …
```

### Naming rules

- **Folder** = catalog family (`men`, `women`, `kids`, `winter`, `household`, `accessories`, `services`, `heroes`).
- **File** = kebab-case garment slug (`saree-normal.webp`, `jacket-puffer.webp`).
- **Photo key** (`PricingProductPhotoKey`) = short snake_case identifier in code (`saree`, `jacket_puffer`) — mapped in `CATALOG_TILE_BY_KEY` inside `washhouse-catalog-photos.ts`.
- Multiple platform slugs → one key → one canonical file (variants use `placeholder: true` in manifest until unique crops exist).

### Code map

```
resolveCatalogPhotoKey(slug, name)
        ↓
PricingProductPhotoKey
        ↓
/catalog/{category}/{file}.webp
        ↓
next/image (4∶3 frame on /pricing)
```

---

## Related docs

- `public/catalog/README.md` — extract script, manifest, prefetch sizes
- `docs/features/marketing-homepage.md` — service preview wiring
- `docs/features/partner-price-list.md` — pricing rack UX
