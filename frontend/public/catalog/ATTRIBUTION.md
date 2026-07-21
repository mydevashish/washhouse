# WashHouse catalog — image attribution

Credits for third-party photographs used in `public/catalog/`.  
WashHouse-owned assets (custom shoot, collage derivatives, office sample imports) do **not** need a row here.

> **Process:** Add a row **before** merging any stock asset. See `docs/design/washhouse-image-style-guide.md`.

---

## Template (copy for each new asset)

```markdown
### {category}/{filename}.webp

| Field | Value |
| ----- | ----- |
| **Photo key** | `{PricingProductPhotoKey}` e.g. `kurta` |
| **Title / description** | Short description of what the image shows |
| **Photographer** | Full name or username |
| **Source** | Unsplash / Pexels / Pixabay / Other |
| **Source URL** | Direct page URL to the photo |
| **License** | e.g. Unsplash License, Pexels License |
| **Downloaded** | YYYY-MM-DD |
| **Added by** | Name or GitHub handle |
| **Notes** | Cropped from original; model release; any modifications |
```

---

## Attributed assets

Stock tiles exported at **1200 × 900** WebP q85 via `scripts/download-catalog-stock.py`. Full source URLs and photographers: `scripts/catalog-stock-sources.json`.

### Still credited third-party stock (not replaced by sample import)

| File | Source | Photographer | URL |
| ---- | ------ | ------------ | --- |
| `men/suit-2pcs.webp` | Unsplash | Victoria Priessnitz | https://unsplash.com/photos/black-suit-jacket-on-white-plastic-clothes-hanger-VsCBt8j-qg4 |
| `women/lehenga-normal.webp` | Pexels | Nguyễn Văn Minh Vương | https://www.pexels.com/photo/woman-in-red-and-gold-floral-sari-dress-8485746/ |
| `women/blouse-choli.webp` | Pexels | aman ajimal Fashion Stylist | https://www.pexels.com/photo/a-woman-in-red-and-gold-sari-dress-13095687/ |
| `household/blanket.webp` | Pexels | Engin Akyurt | https://www.pexels.com/photo/gray-knitted-fabric-in-close-up-photography-10221752/ |
| `household/comforter.webp` | Unsplash | Spacejoy | https://unsplash.com/photos/quilted-white-comforter-R-w5Q-4Mqm0 |
| `services/wash-fold.webp` | Unsplash | Annie Spratt | https://unsplash.com/photos/blue-plastic-laundry-basket-filled-with-clothes-9V3IZktFeM0 |
| `services/wash-iron.webp` | Pexels | Pixabay | https://www.pexels.com/photo/assorted-clothes-hanging-on-wooden-hangers-996329/ |
| `accessories/gloves-leather.webp` | Unsplash | Adam Hornyak | https://unsplash.com/photos/a-pair-of-brown-leather-gloves-on-a-white-background-RLShnUiFFNA |
| `accessories/trolley-s.webp` | Unsplash | Cyberbackpack.com | https://unsplash.com/photos/a-black-suitcase-with-wheels-on-a-white-background-pmJAM2Fxbos |
| `accessories/trolley-l.webp` | Unsplash | Cyberbackpack.com | https://unsplash.com/photos/a-black-suitcase-with-wheels-on-a-white-background-pmJAM2Fxbos |

### Kids & winter stock batch (P1) — tiles not replaced by sample import

Remaining `kids/*.webp` and winter tiles that were **not** overwritten by the 2026-07 sample drop — see `scripts/catalog-stock-sources.json` for per-file credits. Downloaded **2026-07-20**.

Sample import **replaced** (office-owned product photos; no third-party credit):  
`kids/girl-dress.webp`, `winter/half-jacket-cotton-denim.webp`, `winter/hoodie.webp`, `winter/jacket-cotton-denim.webp`, `winter/jacket-leather.webp`, `winter/overcoat-men-women.webp`, `winter/shawl.webp`, `winter/sweater.webp`.

### Office sample import (2026-07-21)

Product photos from `public/sample/` → `npm run catalog:optimize -- --from-sample --remove-bg --force`.  
**Source:** WashHouse office sample drop (not Unsplash/Pexels). **License:** Internal.  
Manifest rows use `"source": "stock"`. Mapping: `public/sample/MAPPING.md`.

Replaced tiles include (non-exhaustive): `men/shirt.webp`, `men/trouser.webp`, `men/kurta.webp`, `men/lower.webp`, `men/jogger.webp`, `men/shorts.webp`, `men/dhoti.webp`, `men/cap-fabric.webp`, `men/coat-formal.webp`, `men/tie.webp`, `women/saree-normal.webp`, `women/saree-heavy.webp`, `women/gown.webp`, `women/dupatta.webp`, `women/top-kurti.webp`, `women/skirt-*.webp`, `women/full-dress-*.webp`, `women/frock-normal.webp`, `women/kameez-normal.webp`, `women/kurta.webp`, `women/burkha.webp`, `household/bedsheet.webp`, `household/curtain.webp`, `household/pillow-cover.webp`, `household/towel.webp`, `accessories/shoes.webp`, `accessories/heels.webp`, `accessories/handbag.webp`, `accessories/backpack.webp`, `accessories/school-bag.webp`, `accessories/gloves-cotton.webp`, `accessories/trolley-m.webp`, plus the winter/kids tiles listed above.

**2026-07-21 follow-up:** re-encoded `_imports` with content-bbox crop + upscale so subjects fill ~82% of the 1200×900 frame (Amazon `_SL360_` sources were previously left tiny because PIL `thumbnail` never enlarges). Lifestyle Unsplash/Pexels swaps for shirt/kurta/hoodie were rejected — they break the single-garment white-tile look; sample product shots stay.

Prior Unsplash/Pexels credits for those filenames no longer apply.

---

## Hero images

### Catalog collage heroes (`catalog/heroes/`)

| File | Notes |
| ---- | ----- |
| `heroes/fresh-laundry.webp` | Brand collage derivative — shirts on hangers + folded towels |
| `heroes/store-interior.webp` | Brand collage derivative — WashHouse storefront / tagged garments |

### Marketing heroes (`public/marketing/heroes/`) — verified 2026-07-21

Prior v1 Pexels IDs in `marketing-hero-sources.json` had been **recycled to food/art** on disk. Replaced with visually verified laundry sources via `scripts/download-marketing-heroes.py`.

| File | Source | Photographer | URL | Subject |
| ---- | ------ | ------------ | --- | ------- |
| `../marketing/heroes/welcome.webp` | Unsplash | Dan Gold | https://unsplash.com/photos/person-holding-knitted-textiles-aJN-jjFLyCU | Folded knit sweaters |
| `../marketing/heroes/services.webp` | Unsplash | Jeremy Sallee | https://unsplash.com/photos/shallow-focus-photo-of-washing-machines-lgrM1t4rxWQ | Commercial washer row |
| `../marketing/heroes/franchise.webp` | Pexels | cottonbro studio | https://www.pexels.com/photo/man-and-woman-sitting-on-the-floor-7619396/ | Laundromat + washers |
| `../marketing/heroes/delivery.webp` | Pexels | cottonbro studio | https://www.pexels.com/photo/overhead-shot-of-a-person-holding-a-laundry-basket-with-bed-sheets-5902888/ | Laundry basket / linens |

Quarantined food/off-brand v1 files: `public/marketing/_quarantine/heroes-2026-07-21/`.

### Service tiles re-verified 2026-07-21

| File | Source | Photographer | URL | Subject |
| ---- | ------ | ------------ | --- | ------- |
| `services/wash-fold.webp` | Unsplash | Annie Spratt | https://unsplash.com/photos/blue-plastic-laundry-basket-filled-with-clothes-9V3IZktFeM0 | Laundry basket with clothes |
| `services/wash-iron.webp` | Pexels | Pixabay | https://www.pexels.com/photo/assorted-clothes-hanging-on-wooden-hangers-996329/ | Pressed shirts on hangers |

Prior plant/nature tiles quarantined: `public/catalog/_quarantine/2026-07-21/`.

### Empty-stub remediation 2026-07-21 (QA)

Near-empty collage stubs (~&lt;2% non-white content) were remapped or replaced so marketing surfaces never show blank white tiles:

| File | Action |
| ---- | ------ |
| `winter/jacket-puffer.webp` | Replaced with sibling `winter/half-jacket-puffer.webp` (office sample / stock fill) |
| `men/sherwani-cotton.webp` | Replaced with sibling `kids/sherwani-cotton.webp` (same garment family, filled frame) |
| Homepage **More Services** | Points at `winter/hoodie.webp` — `services/steam-ironing.webp` remains a stub until a real steam-press shoot lands |

Homepage services uniqueness still holds (no duplicate `src` across `SERVICE_PREVIEW_ITEMS`).

---

## Approved sources (quick reference)

| Source | Attribution required? | Commercial use |
| ------ | --------------------- | -------------- |
| Unsplash | Appreciated, not required | Yes |
| Pexels | No | Yes |
| Pixabay | No | Yes (verify per asset) |
| Custom shoot | N/A (work-for-hire) | Yes |
| Brand collage | N/A | Yes |
| Office sample import | N/A (internal) | Yes |

**Do not use:** watermarked previews, CC-BY-NC-only images, clip-art sites, unverified blog downloads.

Full policy: `docs/design/washhouse-image-style-guide.md` § Licensing.
