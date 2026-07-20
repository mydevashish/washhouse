"""Download and export 16:9 marketing hero WebPs under public/marketing/heroes/.

Reads ``marketing-hero-sources.json``, center-crops to 1920×1080, and writes WebP
at quality 82–85 for LCP-friendly homepage heroes.

Usage::

    cd frontend
    python scripts/download-marketing-heroes.py
    python scripts/download-marketing-heroes.py --id welcome
    python scripts/download-marketing-heroes.py --dry-run
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
FRONTEND_DIR = SCRIPT_DIR.parent
PUBLIC_DIR = FRONTEND_DIR / 'public'
SOURCES_PATH = SCRIPT_DIR / 'marketing-hero-sources.json'

DEFAULT_WIDTH = 1920
DEFAULT_HEIGHT = 1080
DEFAULT_QUALITY = 82


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding='utf-8') as fh:
        return json.load(fh)


def download_image(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': 'WashHouse-marketing-heroes/1.0'})
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read()
    return Image.open(BytesIO(data)).convert('RGB')


def crop_cover_16_9(
    img: Image.Image,
    *,
    width: int,
    height: int,
    focal_y: float = 0.5,
) -> Image.Image:
    """Cover-crop to *width*×*height* with optional vertical focal point (0–1)."""
    target_ratio = width / height
    src_ratio = img.width / img.height

    if src_ratio > target_ratio:
        crop_h = img.height
        crop_w = round(crop_h * target_ratio)
        left = (img.width - crop_w) // 2
        top = 0
    else:
        crop_w = img.width
        crop_h = round(crop_w / target_ratio)
        left = 0
        max_top = img.height - crop_h
        top = round(max_top * focal_y)

    cropped = img.crop((left, top, left + crop_w, top + crop_h))
    if cropped.size != (width, height):
        return cropped.resize((width, height), Image.Resampling.LANCZOS)
    return cropped


def save_hero_webp(
    img: Image.Image,
    out_path: Path,
    *,
    width: int,
    height: int,
    quality: int,
    focal_y: float = 0.5,
) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    hero = crop_cover_16_9(img, width=width, height=height, focal_y=focal_y)
    hero.save(out_path, 'WEBP', quality=quality, method=6)
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id', action='append', help='Process only this hero id (repeatable)')
    parser.add_argument('--dry-run', action='store_true', help='List assets without downloading')
    parser.add_argument('--quality', type=int, default=None)
    args = parser.parse_args()

    sources = load_json(SOURCES_PATH)
    output_cfg = sources.get('output', {})
    width = int(output_cfg.get('width', DEFAULT_WIDTH))
    height = int(output_cfg.get('height', DEFAULT_HEIGHT))
    quality = args.quality if args.quality is not None else int(output_cfg.get('webpQuality', DEFAULT_QUALITY))

    assets: list[dict[str, Any]] = sources.get('assets', [])
    if args.id:
        wanted = set(args.id)
        assets = [a for a in assets if a['id'] in wanted]
        missing = wanted - {a['id'] for a in assets}
        if missing:
            print(f"Unknown id(s): {', '.join(sorted(missing))}", file=sys.stderr)
            return 1

    if not assets:
        print('No assets to process.', file=sys.stderr)
        return 1

    if args.dry_run:
        for asset in assets:
            print(f"DRY RUN {asset['id']:10} -> public/{asset['file']}")
        return 0

    failures: list[str] = []
    for asset in assets:
        hero_id = asset['id']
        rel_file = asset['file']
        out_path = PUBLIC_DIR / rel_file
        focal_y = float(asset.get('focalY', 0.5))
        try:
            img = download_image(asset['url'])
            save_hero_webp(
                img,
                out_path,
                width=width,
                height=height,
                quality=quality,
                focal_y=focal_y,
            )
            with Image.open(out_path) as saved:
                kb = out_path.stat().st_size / 1024
                print(
                    f"  {hero_id:10} -> public/{rel_file} "
                    f"({saved.size[0]}×{saved.size[1]} WebP q{quality}, {kb:.0f} KB)"
                )
        except Exception as exc:  # noqa: BLE001 — batch script reports all failures
            failures.append(f'{hero_id}: {exc}')
            print(f"  FAIL {hero_id}: {exc}", file=sys.stderr)

    if failures:
        print(f'\n{len(failures)} failure(s).', file=sys.stderr)
        return 1

    print(f'DONE — {len(assets)} hero WebP(s) in public/marketing/heroes/')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
