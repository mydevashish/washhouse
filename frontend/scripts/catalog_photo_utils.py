"""Shared helpers for WashHouse catalog WebP tiles (4:3 product frames)."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image

TILE_WIDTH = 1200
TILE_HEIGHT = 900
TILE_BG = (255, 255, 255)
DEFAULT_WEBP_QUALITY = 85
DEFAULT_FILL_RATIO = 0.82


def fit_on_tile_canvas(
    img: Image.Image,
    *,
    width: int = TILE_WIDTH,
    height: int = TILE_HEIGHT,
    bg: tuple[int, int, int] = TILE_BG,
    fill_ratio: float = DEFAULT_FILL_RATIO,
) -> Image.Image:
    """Center *img* on a 4:3 canvas, scaling to ~fill_ratio of the frame."""
    rgba = img.convert('RGBA')
    max_w = max(1, int(width * fill_ratio))
    max_h = max(1, int(height * fill_ratio))
    rgba.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

    canvas = Image.new('RGB', (width, height), bg)
    x = (width - rgba.width) // 2
    y = (height - rgba.height) // 2
    canvas.paste(rgba, (x, y), rgba)
    return canvas


def save_catalog_webp(
    img: Image.Image,
    out_path: Path,
    *,
    quality: int = DEFAULT_WEBP_QUALITY,
) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tile = fit_on_tile_canvas(img) if img.size != (TILE_WIDTH, TILE_HEIGHT) else img.convert('RGB')
    tile.save(out_path, 'WEBP', quality=quality, method=6)
    return out_path


def collage_crop_to_tile(
    source: Image.Image,
    crop: dict[str, Any],
    *,
    width: int = TILE_WIDTH,
    height: int = TILE_HEIGHT,
    quality: int = DEFAULT_WEBP_QUALITY,
) -> Image.Image:
    box = (
        int(crop['x']),
        int(crop['y']),
        int(crop['x']) + int(crop['w']),
        int(crop['y']) + int(crop['h']),
    )
    tile = source.crop(box)
    return fit_on_tile_canvas(tile.convert('RGB'), width=width, height=height)
