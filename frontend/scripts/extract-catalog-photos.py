"""Crop WashHouse service-catalog tiles from the source collage into WebP assets.

Reads crop boxes from ``public/catalog/manifest.json`` and writes files under
``public/catalog/<category>/``. Re-run after replacing the source JPEG or
tweaking manifest coordinates.

Items with ``"source": "stock"`` are **skipped** — those WebPs are placed
directly via ``prepare-catalog-stock-photo.py`` or ``download-catalog-stock.py``.

Requires Pillow (same as ``generate-brand-assets.py``).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from catalog_photo_utils import (  # noqa: E402
    DEFAULT_WEBP_QUALITY,
    TILE_HEIGHT,
    TILE_WIDTH,
    collage_crop_to_tile,
    fit_on_tile_canvas,
)

FRONTEND_DIR = SCRIPT_DIR.parent
CATALOG_DIR = FRONTEND_DIR / 'public' / 'catalog'
MANIFEST_PATH = CATALOG_DIR / 'manifest.json'
HEROES_DIR = CATALOG_DIR / 'heroes'

# Wide marketing-hero crops (1536×1024 source) — not 110 px product tiles.
HERO_CROPS: list[tuple[str, tuple[int, int, int, int], int]] = [
    ('store-interior.webp', (900, 830, 1530, 1020), 1200),
    ('fresh-laundry.webp', (0, 8, 505, 298), 1200),
]


def load_manifest(path: Path = MANIFEST_PATH) -> dict[str, Any]:
    with path.open(encoding='utf-8') as fh:
        return json.load(fh)


def resolve_source_path(manifest: dict[str, Any]) -> Path:
    rel = manifest.get('source', '../brand/washhouse-service-catalog-source.jpeg')
    source = (CATALOG_DIR / rel).resolve()
    if not source.is_file():
        raise FileNotFoundError(
            f'Source collage not found: {source}\n'
            'Place the master JPEG at public/brand/washhouse-service-catalog-source.jpeg '
            '(see public/catalog/README.md).',
        )
    return source


def resize_to_target_width(img: Image.Image, target_width: int) -> Image.Image:
    if img.width == target_width:
        return img
    ratio = target_width / img.width
    target_height = max(1, round(img.height * ratio))
    return img.resize((target_width, target_height), Image.Resampling.LANCZOS)


def extract_item(
    source: Image.Image,
    item: dict[str, Any],
    output_root: Path,
    *,
    target_width: int,
    target_height: int,
    webp_quality: int,
) -> Path | None:
    if item.get('source') == 'stock':
        return None

    crop = item.get('crop')
    if not crop:
        print(f"  SKIP {item.get('slug', '?')}: no crop and not stock", file=sys.stderr)
        return None

    tile = collage_crop_to_tile(
        source,
        crop,
        width=target_width,
        height=target_height,
        quality=webp_quality,
    )

    rel_file = item['file']
    out_path = output_root / rel_file
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tile.save(out_path, 'WEBP', quality=webp_quality, method=6)
    return out_path


def extract_heroes(
    source: Image.Image,
    *,
    webp_quality: int,
) -> list[Path]:
    HEROES_DIR.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for filename, box, target_width in HERO_CROPS:
        tile = source.crop(box).convert('RGB')
        tile = resize_to_target_width(tile, target_width)
        out_path = HEROES_DIR / filename
        tile.save(out_path, 'WEBP', quality=webp_quality, method=6)
        written.append(out_path)
        print(f"  hero:{filename:24} -> {out_path.relative_to(FRONTEND_DIR)}")
    return written


def main() -> int:
    manifest = load_manifest()
    source_path = resolve_source_path(manifest)
    output_cfg = manifest.get('output', {})
    target_width = int(output_cfg.get('targetWidth', TILE_WIDTH))
    target_height = int(output_cfg.get('targetHeight', TILE_HEIGHT))
    webp_quality = int(output_cfg.get('webpQuality', DEFAULT_WEBP_QUALITY))

    source = Image.open(source_path)
    print(f'Source: {source_path} ({source.size[0]}×{source.size[1]})')
    print(f'Output: {target_width}×{target_height} WebP q{webp_quality}')

    items: list[dict[str, Any]] = manifest.get('items', [])
    if not items:
        print('No items in manifest.', file=sys.stderr)
        return 1

    written: list[Path] = []
    skipped_stock = 0
    for item in items:
        if item.get('source') == 'stock':
            skipped_stock += 1
            continue
        out = extract_item(
            source,
            item,
            CATALOG_DIR,
            target_width=target_width,
            target_height=target_height,
            webp_quality=webp_quality,
        )
        if out:
            written.append(out)
            print(f"  {item['slug']:40} -> {out.relative_to(FRONTEND_DIR)}")

    print(f'Skipped {skipped_stock} stock tile(s) (direct WebP placement).')
    print('Hero crops:')
    hero_written = extract_heroes(source, webp_quality=webp_quality)
    written.extend(hero_written)

    print(f'DONE — {len(written)} WebP files in {CATALOG_DIR.relative_to(FRONTEND_DIR)}/')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
