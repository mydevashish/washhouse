# Sample → catalog mapping

Approved replace mapping for `npm run catalog:optimize -- --from-sample --remove-bg --force`.

Source of truth in code: `SAMPLE_MAPPING` in `frontend/scripts/optimize-catalog-imports.py`.

Samples are office product photos (often Amazon `_SL360_` WebPs). Pipeline:

1. Punch near-white background → transparent PNG under `public/catalog/_imports/<category>/`
2. Fit onto **1200 × 900** white canvas (~82% subject height) → `public/catalog/<category>/*.webp`
3. Delete successfully mapped samples; leave skips in `SKIPPED.md`

| sample filename | catalog path | photo key |
| --- | --- | --- |
| `Anarkali.webp` | `women/gown.webp` | `gown` |
| `Bag.webp` | `accessories/school-bag.webp` | `bag` (school) |
| `Bedsheet.webp` | `household/bedsheet.webp` | `bedsheet` |
| `Burkha.webp` | `women/burkha.webp` | `gown` (burkha slug) |
| `Cap.webp` | `men/cap-fabric.webp` | `cap` |
| `Cargo.webp` | `men/jogger.webp` | `jogger` |
| `Coat.webp` | `men/coat-formal.webp` | `coat` |
| `Curtain.webp` | `household/curtain.webp` | `curtain` (supplemental) |
| `Dupatta.webp` | `women/dupatta.webp` | `dupatta` |
| `Gloves.webp` | `accessories/gloves-cotton.webp` | `gloves` |
| `Half jacket.webp` | `winter/half-jacket-cotton-denim.webp` | `jacket_denim` |
| `Heels.webp` | `accessories/heels.webp` | `heels` |
| `Hoodie.webp` | `winter/hoodie.webp` | `hoodie` |
| `Jacket.webp` | `winter/jacket-cotton-denim.webp` | `jacket_denim` |
| `Jeans.webp` | `men/trouser.webp` | `trouser` |
| `Kids girl dress.webp` | `kids/girl-dress.webp` | `girl_dress` |
| `Leather jacket.webp` | `winter/jacket-leather.webp` | `jacket_leather` |
| `Leatherbag.webp` | `accessories/backpack.webp` | `bag` |
| `Lower.webp` | `men/lower.webp` | `lower` |
| `Lungi.webp` | `men/dhoti.webp` | `dhoti` |
| `Men kurta.webp` | `men/kurta.webp` | `kurta` |
| `Overcoat.webp` | `winter/overcoat-men-women.webp` | `overcoat` |
| `Pillow cover.webp` | `household/pillow-cover.webp` | `pillow` |
| `Purse.webp` | `accessories/handbag.webp` | `purse` |
| `Saare heavy.webp` | `women/saree-heavy.webp` | `saree` |
| `Saree normal.webp` | `women/saree-normal.webp` | `saree` |
| `Shawl.webp` | `winter/shawl.webp` | `shawl` |
| `Shirt.webp` | `men/shirt.webp` | `shirt` |
| `Shoes.webp` | `accessories/shoes.webp` | `shoes` |
| `Shorts.webp` | `men/shorts.webp` | `shorts` |
| `Skirt large.webp` | `women/skirt-long.webp` | `skirt` |
| `Skirt small.webp` | `women/skirt-short.webp` | `skirt` |
| `Sweater.webp` | `winter/sweater.webp` | `sweater` |
| `Tie.webp` | `men/tie.webp` | `tie` |
| `Towel.webp` | `household/towel.webp` | `towel` |
| `Trolley bag.webp` | `accessories/trolley-m.webp` | `trolley` |
| `Women full dress.webp` | `women/full-dress-party.webp` | `dress` |
| `Women kurta.webp` | `women/kurta.webp` | `kurta` |
| `Women short dress.webp` | `women/full-dress-normal.webp` | `dress` |
| `4bxt1B1204uOy-d._SL360_QL95_FMwebp_.webp` | `women/top-kurti.webp` | `top` |
| `abxt1hjw-XuUDdJ._SL360_QL95_FMwebp_.webp` | `women/kameez-normal.webp` | `top` / `kurta` |
| `xbxt1xE$1UHxodK._SL360_QL95_FMwebp_.webp` | `women/frock-normal.webp` | `frock` |

## Skipped (see `SKIPPED.md`)

| sample filename | reason |
| --- | --- |
| `Shocks.webp` | No socks/shocks seed slug |
| `Tshirt.webp` | Same tile as `Shirt.webp` → `men/shirt.webp` |
| `Pbxt1BNiDJSisrR._SL360_QL95_FMwebp_.webp` | Duplicate men kurta; prefer `Men kurta.webp` |
| `fbxt1hTbpb8e24L._SL360_QL95_FMwebp_.webp` | Duplicate short skirt; prefer `Skirt small.webp` |

## Notes

- Many samples are Amazon `_SL360_` product WebPs (360×360). The optimize pipeline **upscales** onto 1200×900 after alpha crop so subjects fill ~82% frame height.
- Prefer **photo** samples over vector/clip-art when re-dropping (shirt/hoodie office samples are illustrative; saree/shoes/curtain/jeans are photographic).
- Lifestyle Unsplash/Pexels “stock” swaps that show people or busy scenes break the Bharat Laundry single-garment white-tile look — keep product-isolated assets.

## Re-run

```bash
cd frontend
# Drop raw samples into public/sample/, then:
npm run catalog:optimize -- --from-sample --remove-bg --force

# Or re-encode existing _imports only (after sample cleanup):
npm run catalog:optimize -- --force
```
