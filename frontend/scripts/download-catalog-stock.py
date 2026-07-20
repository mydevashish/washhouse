"""Download curated stock photos and patch manifest.json for direct WebP tiles.

Reads ``catalog-stock-sources.json``, writes 1200×900 WebP files under
``public/catalog/``, and marks matching manifest slugs with ``source: "stock"``.

Usage::

    cd frontend
    python scripts/download-catalog-stock.py
    python scripts/download-catalog-stock.py --slug men-shirt-tshirt
    python scripts/download-catalog-stock.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from catalog_photo_utils import (  # noqa: E402
    DEFAULT_WEBP_QUALITY,
    TILE_HEIGHT,
    TILE_WIDTH,
    save_catalog_webp,
)

FRONTEND_DIR = SCRIPT_DIR.parent
CATALOG_DIR = FRONTEND_DIR / 'public' / 'catalog'
MANIFEST_PATH = CATALOG_DIR / 'manifest.json'
SOURCES_PATH = SCRIPT_DIR / 'catalog-stock-sources.json'


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding='utf-8') as fh:
        return json.load(fh)


def download_image(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': 'WashHouse-catalog-stock/1.0'})
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read()
    return Image.open(BytesIO(data))


def patch_manifest(manifest: dict[str, Any], slugs: set[str]) -> int:
    patched = 0
    for item in manifest.get('items', []):
        if item.get('slug') not in slugs:
            continue
        item['source'] = 'stock'
        for key in ('placeholder', 'cropFrom', 'note', 'crop'):
            item.pop(key, None)
        patched += 1
    return patched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--slug', action='append', help='Process only this manifest slug (repeatable)')
    parser.add_argument('--dry-run', action='store_true', help='List assets without downloading')
    parser.add_argument('--quality', type=int, default=DEFAULT_WEBP_QUALITY)
    args = parser.parse_args()

    sources = load_json(SOURCES_PATH)
    assets: list[dict[str, Any]] = sources.get('assets', [])
    if args.slug:
        wanted = set(args.slug)
        assets = [a for a in assets if a['slug'] in wanted]
        missing = wanted - {a['slug'] for a in assets}
        if missing:
            print(f'Unknown slug(s): {", ".join(sorted(missing))}', file=sys.stderr)
            return 1

    if not assets:
        print('No assets to process.', file=sys.stderr)
        return 1

    if args.dry_run:
        for asset in assets:
            print(f"DRY RUN {asset['slug']:32} -> public/catalog/{asset['file']}")
        return 0

    manifest = load_json(MANIFEST_PATH)
    processed_slugs: set[str] = set()
    failures: list[str] = []

    for asset in assets:
        slug = asset['slug']
        rel_file = asset['file']
        out_path = CATALOG_DIR / rel_file
        try:
            img = download_image(asset['url'])
            save_catalog_webp(img, out_path, quality=args.quality)
            with Image.open(out_path) as saved:
                if saved.size != (TILE_WIDTH, TILE_HEIGHT):
                    raise ValueError(f'unexpected size {saved.size}')
            processed_slugs.add(slug)
            print(f"OK  {slug:32} -> catalog/{rel_file}")
        except Exception as exc:  # noqa: BLE001 — batch script reports per-asset
            failures.append(f'{slug}: {exc}')
            print(f"FAIL {slug:32} — {exc}", file=sys.stderr)

    if processed_slugs:
        patched = patch_manifest(manifest, processed_slugs)
        with MANIFEST_PATH.open('w', encoding='utf-8', newline='\n') as fh:
            json.dump(manifest, fh, indent=2, ensure_ascii=False)
            fh.write('\n')
        print(f'Patched {patched} manifest row(s) with source: "stock".')

    if failures:
        print(f'\n{len(failures)} failure(s):', file=sys.stderr)
        for line in failures:
            print(f'  - {line}', file=sys.stderr)
        return 1

    print(f'DONE — {len(processed_slugs)} stock tile(s) at {TILE_WIDTH}×{TILE_HEIGHT}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
