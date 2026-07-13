# WashHouse brand source assets

Place the **master logo** here. All public brand files are generated from this folder by `frontend/scripts/generate-brand-assets.py`.

## Current source status

| File | Size | Issue |
|------|------|-------|
| `washhouse-logo-original.png` | 1096 × 683 | Baked white matte (corners ≈ RGB 254,254,254); edges anti-aliased against white, not transparency |

The generation script strips near-white pixels (`RGB > 245`). That works only as a fallback. On the current file it leaves **white halos** on dark backgrounds and **jagged edges** on the faceted W icon, because fringe pixels are kept fully opaque instead of true alpha.

**Replace this file** with a proper transparent export (see below) before shipping brand assets.

---

## What a perfect source looks like

| Requirement | Why |
|-------------|-----|
| **PNG-24 with real alpha** or **SVG** | Edges need partial transparency, not a white fringe baked in |
| **No background layer** | No white, grey, or checkerboard flattened into the image |
| **No baked white matte** | Anti-aliasing must be against *transparency*, not a solid colour |
| **Export from vector** (AI, Figma, EPS) | Keeps diagonals and thin strokes crisp at any size |
| **2× target display size** | Retina-sharp in navbar and heroes; room to downscale cleanly |

### Target dimensions (2×)

| Asset | 1× display | Recommended source |
|-------|------------|-------------------|
| Full wordmark | 962 × 683 px | **≥ 1924 × 1366 px** PNG, or SVG |
| Faceted W icon (left mark only) | 270 × 197 px | Included in full export; script crops automatically |
| PWA / favicon | 512 px square | Script builds from cropped icon |

SVG is ideal for the full wordmark if gradients and effects export cleanly. Otherwise use a high-resolution PNG with transparency.

### Quick quality check

1. Open the file on a **dark grey** (#333) background — no white glow around letters or the W.
2. Zoom to 200% — diagonal edges on the W should be smooth, not stair-stepped.
3. In an image editor, confirm the background layer is **transparent** (checkerboard), not white.

---

## Export settings

### Adobe Photoshop

1. **File → Export → Export As…** (or Save for Web, legacy).
2. Format: **PNG**.
3. Transparency: **checked**.
4. Convert to sRGB: **on**.
5. Delete or hide the background layer before export — do not flatten onto white.
6. Width: **1924 px** wide (height scales proportionally), or export SVG via Illustrator if available.

### Figma

1. Select the logo frame (full wordmark, icon + text).
2. **Export** panel → **PNG**, **1x** and **2x** (use the 2x file as `washhouse-logo-original.png`).
3. Or export **SVG** if the design is fully vector.
4. Ensure the frame has **no fill** on the background; only the logo layers are visible.

### Canva

1. **File → Download**.
2. Type: **PNG**.
3. **Transparent background** — requires Canva Pro; free tier flattens to white and will not work.
4. Size: **2×** the largest size offered, or custom dimensions ≥ 1924 px wide.

> **Avoid:** JPEG, PNG-8, “save with white background”, or screenshots of the logo on a white page.

---

## Regenerating brand assets

After replacing `washhouse-logo-original.png` (or adding a new master file with that exact name):

```bash
cd frontend
python scripts/generate-brand-assets.py
```

### Expected outputs

| Output | Path |
|--------|------|
| Full transparent wordmark | `public/brand/washhouse-logo.png` |
| Cropped W icon | `public/brand/washhouse-icon.png` |
| Favicon | `public/favicon.ico` |
| PWA icons | `public/icon-192.png`, `public/icon-512.png` |
| Apple touch icon | `public/apple-touch-icon.png` |

### Verification checklist

1. Script prints source size and output paths without errors.
2. Open `washhouse-logo.png` on dark and light backgrounds — no white halo.
3. Open `washhouse-icon.png` at 200% zoom — W facets are crisp.
4. If trimmed dimensions change, update constants in `components/brand/washhouse-logo.tsx`:

   ```ts
   const FULL_LOGO_WIDTH = …;
   const FULL_LOGO_HEIGHT = …;
   const ICON_WIDTH = …;
   const ICON_HEIGHT = …;
   ```

5. Hard-refresh the app (or restart `next dev`) and spot-check navbar, auth pages, and footer.

---

## File naming

| File | Purpose |
|------|---------|
| `washhouse-logo-original.png` | **Required** — input read by the script |
| `washhouse-logo-original.svg` | Optional future input; script currently expects PNG only |

To add SVG support, extend `generate-brand-assets.py` to rasterize SVG at 2× before processing.
