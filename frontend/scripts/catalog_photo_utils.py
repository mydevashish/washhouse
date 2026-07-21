"""Shared helpers for WashHouse catalog WebP tiles (4:3 product frames)."""
from __future__ import annotations

from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image

TILE_WIDTH = 1200
TILE_HEIGHT = 900
TILE_BG = (255, 255, 255)
DEFAULT_WEBP_QUALITY = 85
DEFAULT_FILL_RATIO = 0.82
NEAR_WHITE_THRESHOLD = 248
FRINGE_THRESHOLD = 240


def _is_near_white(r: int, g: int, b: int, *, threshold: int) -> bool:
    return r >= threshold and g >= threshold and b >= threshold


def remove_background_flood(
    img: Image.Image,
    *,
    threshold: int = NEAR_WHITE_THRESHOLD,
    fringe_threshold: int = FRINGE_THRESHOLD,
) -> Image.Image:
    """Punch out near-white background via edge flood-fill (keeps interior whites)."""
    rgba = img.convert('RGBA')
    w, h = rgba.size
    pixels = rgba.load()
    visited = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        idx = y * w + x
        if visited[idx]:
            return
        r, g, b, a = pixels[x, y]
        if a == 0 or not _is_near_white(r, g, b, threshold=threshold):
            return
        visited[idx] = 1
        queue.append((x, y))

    for x in range(w):
        enqueue(x, 0)
        enqueue(x, h - 1)
    for y in range(h):
        enqueue(0, y)
        enqueue(w - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (255, 255, 255, 0)
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < w:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < h:
            enqueue(x, y + 1)

    # Clear anti-aliased fringe next to already-transparent background (no garment erode).
    fringe: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0 or not _is_near_white(r, g, b, threshold=fringe_threshold):
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and pixels[nx, ny][3] == 0:
                    fringe.append((x, y))
                    break
    for x, y in fringe:
        pixels[x, y] = (255, 255, 255, 0)

    return rgba


def remove_background(img: Image.Image, *, engine: str = 'flood') -> Image.Image:
    """Remove backdrop. ``engine``: ``flood`` (default) or ``rembg`` when installed."""
    if engine == 'rembg':
        try:
            from rembg import remove as rembg_remove  # type: ignore[import-untyped]
        except ImportError as exc:
            raise ImportError('rembg is not installed; use --remove-bg-engine flood') from exc

        result = rembg_remove(img.convert('RGBA'))
        if isinstance(result, (bytes, bytearray)):
            from io import BytesIO

            return Image.open(BytesIO(result)).convert('RGBA')
        return result.convert('RGBA')

    return remove_background_flood(img)


def crop_to_content(img: Image.Image) -> Image.Image:
    """Trim transparent (or fully empty) padding so fill_ratio applies to the subject."""
    rgba = img.convert('RGBA')
    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def fit_on_tile_canvas(
    img: Image.Image,
    *,
    width: int = TILE_WIDTH,
    height: int = TILE_HEIGHT,
    bg: tuple[int, int, int] = TILE_BG,
    fill_ratio: float = DEFAULT_FILL_RATIO,
) -> Image.Image:
    """Center *img* on a 4∶3 canvas, scaling subject to ~fill_ratio of the frame.

    Upscales small sources (e.g. 360×360 Amazon samples) — PIL ``thumbnail`` only
    shrinks and left those tiles tiny on the white canvas.
    """
    rgba = crop_to_content(img)
    max_w = max(1, int(width * fill_ratio))
    max_h = max(1, int(height * fill_ratio))
    scale = min(max_w / rgba.width, max_h / rgba.height)
    new_w = max(1, round(rgba.width * scale))
    new_h = max(1, round(rgba.height * scale))
    resized = rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new('RGB', (width, height), bg)
    x = (width - new_w) // 2
    y = (height - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_catalog_webp(
    img: Image.Image,
    out_path: Path,
    *,
    quality: int = DEFAULT_WEBP_QUALITY,
) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Always re-fit: sources already at 1200×900 may still have tiny subjects + padding.
    tile = fit_on_tile_canvas(img)
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
