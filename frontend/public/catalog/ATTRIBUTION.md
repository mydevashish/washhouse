# WashHouse catalog — image attribution

Credits for third-party photographs used in `public/catalog/`.  
WashHouse-owned assets (custom shoot, collage derivatives) do **not** need a row here.

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

### P0 — `/pricing` rack tiles

| File | Source | Photographer | URL |
| ---- | ------ | ------------ | --- |
| `men/shirt.webp` | Unsplash | Nimble Made | https://unsplash.com/photos/white-button-up-shirt-on-clothes-hanger-hMMXhKSZk7k |
| `women/saree-normal.webp` | Pexels | Anastasia Shuraeva | https://www.pexels.com/photo/woman-in-red-and-gold-sari-dress-8750018/ |
| `men/trouser.webp` | Pexels | cottonbro studio | https://www.pexels.com/photo/blue-denim-jeans-on-white-surface-8613309/ |
| `men/kurta.webp` | Pexels | Abhishek Shekhawat | https://www.pexels.com/photo/handsome-man-in-traditional-wear-13222257/ |
| `men/suit-2pcs.webp` | Unsplash | Victoria Priessnitz | https://unsplash.com/photos/black-suit-jacket-on-white-plastic-clothes-hanger-VsCBt8j-qg4 |
| `women/lehenga-normal.webp` | Pexels | Nguyễn Văn Minh Vương | https://www.pexels.com/photo/woman-in-red-and-gold-floral-sari-dress-8485746/ |
| `women/blouse-choli.webp` | Pexels | aman ajimal Fashion Stylist | https://www.pexels.com/photo/a-woman-in-red-and-gold-sari-dress-13095687/ |
| `household/bedsheet.webp` | Unsplash | Spacejoy | https://unsplash.com/photos/white-bed-linen-on-bed-1631049307264 |
| `household/blanket.webp` | Pexels | Engin Akyurt | https://www.pexels.com/photo/gray-knitted-fabric-in-close-up-photography-10221752/ |
| `household/comforter.webp` | Unsplash | Spacejoy | https://unsplash.com/photos/quilted-white-comforter-R-w5Q-4Mqm0 |
| `accessories/shoes.webp` | Pexels | Melvin Buezo | https://www.pexels.com/photo/photo-of-sneakers-on-white-background-2529148/ |
| `services/wash-fold.webp` | Pexels | cottonbro studio | https://www.pexels.com/photo/person-holding-white-button-up-long-sleeved-shirt-4041789/ |
| `services/wash-iron.webp` | Pexels | cottonbro studio | https://www.pexels.com/photo/person-holding-white-button-up-long-sleeved-shirt-4041789/ |

### Kids & winter stock batch (P1)

All `kids/*.webp` and winter placeholder tiles (`winter/sweater-kids.webp`, `winter/overcoat-*.webp`, `winter/jacket-*.webp`, `winter/half-jacket-*.webp`, `winter/cap.webp`, `winter/hoodie.webp`) — see `scripts/catalog-stock-sources.json` for per-file credits. Downloaded **2026-07-20**.

### Accessories stock batch (P1 — wrong placeholder crops)

| File | Source | Photographer | URL |
| ---- | ------ | ------------ | --- |
| `accessories/gloves-cotton.webp` | Pexels | Marija Makarova | https://www.pexels.com/photo/white-cloth-gloves-on-white-background-7266912/ |
| `accessories/gloves-leather.webp` | Unsplash | Adam Hornyak | https://unsplash.com/photos/a-pair-of-brown-leather-gloves-on-a-white-background-RLShnUiFFNA |
| `accessories/heels.webp` | Pexels | Lucent Designs Media International | https://www.pexels.com/photo/elegant-high-heel-shoes-on-white-background-28821783/ |
| `accessories/trolley-s.webp` | Unsplash | Cyberbackpack.com | https://unsplash.com/photos/a-black-suitcase-with-wheels-on-a-white-background-pmJAM2Fxbos |
| `accessories/trolley-m.webp` | Unsplash | Cyberbackpack.com | https://unsplash.com/photos/a-suit-case-is-open-on-a-white-surface-2heJHPFDpKU |
| `accessories/trolley-l.webp` | Unsplash | Cyberbackpack.com | https://unsplash.com/photos/a-black-suitcase-with-wheels-on-a-white-background-pmJAM2Fxbos |

Downloaded **2026-07-20** via `scripts/download-catalog-stock.py`.

---

## Hero images

### heroes/fresh-laundry.webp

| Field | Value |
| ----- | ----- |
| **Photo key** | — (hero) |
| **Title / description** | Freshly laundered shirts and folded towels |
| **Photographer** | _TBD if stock replaces collage crop_ |
| **Source** | Collage (brand-owned derivative) |
| **Source URL** | — |
| **License** | Internal |
| **Downloaded** | 2026-07-18 |
| **Added by** | — |
| **Notes** | Wide crop from service-catalog source via `extract-catalog-photos.py` |

### heroes/store-interior.webp

| Field | Value |
| ----- | ----- |
| **Photo key** | — (hero) |
| **Title / description** | WashHouse-style laundry store interior |
| **Photographer** | _TBD — prefer custom shoot of real partner store_ |
| **Source** | Collage (brand-owned derivative) |
| **Source URL** | — |
| **License** | Internal |
| **Downloaded** | 2026-07-18 |
| **Added by** | — |
| **Notes** | Wide crop from service-catalog source |

---

## Approved sources (quick reference)

| Source | Attribution required? | Commercial use |
| ------ | --------------------- | -------------- |
| Unsplash | Appreciated, not required | Yes |
| Pexels | No | Yes |
| Pixabay | No | Yes (verify per asset) |
| Custom shoot | N/A (work-for-hire) | Yes |
| Brand collage | N/A | Yes |

**Do not use:** watermarked previews, CC-BY-NC-only images, clip-art sites, unverified blog downloads.

Full policy: `docs/design/washhouse-image-style-guide.md` § Licensing.
