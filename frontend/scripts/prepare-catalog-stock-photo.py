"""Prepare a single catalog tile from a local file or remote URL.

Bypasses the collage extract pipeline — use with ``source: "stock"`` in manifest.json.

Examples::

    python scripts/prepare-catalog-stock-photo.py \\
        --url "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg" \\
        --out public/catalog/men/shirt.webp

    python scripts/prepare-catalog-stock-photo.py \\
        --in path/to/raw.jpg --out public/catalog/men/shirt.webp
"""
from __future__ import annotations

import argparse
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from catalog_photo_utils import (  # noqa: E402
    DEFAULT_WEBP_QUALITY,
    TILE_HEIGHT,
    TILE_WIDTH,
    save_catalog_webp,
)


def load_image(*, url: str | None, in_path: Path | None) -> Image.Image:
    if url:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'WashHouse-catalog-stock/1.0'},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        return Image.open(BytesIO(data))
    if in_path and in_path.is_file():
        return Image.open(in_path)
    raise FileNotFoundError('Provide --url or an existing --in path')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', help='Remote image URL (Pexels / Unsplash)')
    parser.add_argument('--in', dest='in_path', type=Path, help='Local source file')
    parser.add_argument(
        '--out',
        type=Path,
        required=True,
        help='Output path relative to frontend/ or absolute',
    )
    parser.add_argument('--quality', type=int, default=DEFAULT_WEBP_QUALITY)
    args = parser.parse_args()

    frontend = SCRIPT_DIR.parent
    out_path = args.out if args.out.is_absolute() else frontend / args.out
    in_path = None
    if args.in_path:
        in_path = args.in_path if args.in_path.is_absolute() else frontend / args.in_path

    img = load_image(url=args.url, in_path=in_path)
    save_catalog_webp(img, out_path, quality=args.quality)
    with Image.open(out_path) as saved:
        print(f'Wrote {out_path.relative_to(frontend)} ({saved.size[0]}×{saved.size[1]} WebP q{args.quality})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
