"""One-off script: generate WashHouse brand assets from source PNG."""
from __future__ import annotations

import os

from PIL import Image

SRC = os.path.join(
    os.path.dirname(__file__),
    '..',
    'public',
    'brand',
    'source',
    'washhouse-logo-original.png',
)
BRAND_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'brand')
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

PAD = 4


def trim_to_ink(img: Image.Image, threshold: int = 245, pad: int = PAD) -> Image.Image:
    rgba = img.convert('RGBA')
    arr = rgba.load()
    w, h = rgba.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = arr[x, y]
            if a > 10 and (r < threshold or g < threshold or b < threshold):
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)
    return rgba.crop((min_x, min_y, max_x + 1, max_y + 1))


def find_icon_bounds(img: Image.Image) -> tuple[int, int, int, int]:
    """Crop box (left, top, right, bottom) for the faceted W icon only."""
    rgba = img.convert('RGBA')
    w, h = rgba.size
    arr = rgba.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = arr[x, y]
            if a > 10 and (r < 245 or g < 245 or b < 245):
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

    col_dark: list[tuple[int, int]] = []
    y0 = min_y + (max_y - min_y) // 4
    y1 = max_y - (max_y - min_y) // 4
    search_end = min_x + int((max_x - min_x) * 0.4)
    for x in range(min_x, search_end):
        cnt = sum(
            1
            for y in range(y0, y1)
            if arr[x, y][3] > 10 and arr[x, y][0] < 245
        )
        col_dark.append((x, cnt))

    sep_x = min_x + int((max_x - min_x) * 0.28)
    best_x, best_cnt = sep_x, 999_999
    for x, cnt in col_dark:
        if cnt < best_cnt:
            best_cnt = cnt
            best_x = x

    icon_right = best_x - 2
    icon_left = min_x
    iy0, iy1 = h, 0
    for y in range(h):
        for x in range(icon_left, icon_right + 1):
            r, g, b, a = arr[x, y]
            if a > 10 and (r < 245 or g < 245 or b < 245):
                iy0 = min(iy0, y)
                iy1 = max(iy1, y)

    return (
        max(0, icon_left - PAD),
        max(0, iy0 - PAD),
        min(w - 1, icon_right + PAD),
        min(h - 1, iy1 + PAD),
    )


def make_square_icon(icon_img: Image.Image, size: int) -> Image.Image:
    """Center icon on white square canvas for favicon / PWA."""
    icon = icon_img.convert('RGBA')
    iw, ih = icon.size
    scale = min((size * 0.78) / iw, (size * 0.78) / ih)
    nw = max(1, int(iw * scale))
    nh = max(1, int(ih * scale))
    resized = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def save_ico(path: str, icon_img: Image.Image, sizes: tuple[int, ...] = (16, 32, 48)) -> None:
    """Pack PNG frames into a multi-size ICO (Vista+ PNG-in-ICO)."""
    import io
    import struct

    frames: list[tuple[int, bytes]] = []
    for s in sizes:
        sq = make_square_icon(icon_img, s).convert('RGBA')
        buf = io.BytesIO()
        sq.save(buf, format='PNG')
        frames.append((s, buf.getvalue()))

    count = len(frames)
    header = struct.pack('<HHH', 0, 1, count)
    entries = bytearray()
    image_data = bytearray()
    offset = 6 + 16 * count

    for s, png_bytes in frames:
        w = s if s < 256 else 0
        h = s if s < 256 else 0
        entries.extend(struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(png_bytes), offset))
        offset += len(png_bytes)

    for _, png_bytes in frames:
        image_data.extend(png_bytes)

    with open(path, 'wb') as fh:
        fh.write(header)
        fh.write(entries)
        fh.write(image_data)


def main() -> None:
    os.makedirs(BRAND_DIR, exist_ok=True)
    source = Image.open(SRC)
    print('Source:', source.size)

    full = trim_to_ink(source, pad=2)
    full_path = os.path.join(BRAND_DIR, 'washhouse-logo.png')
    full.save(full_path, 'PNG', optimize=True)
    print('Full logo:', full.size, '->', full_path)

    box = find_icon_bounds(source)
    icon_img = source.crop(box)
    icon_path = os.path.join(BRAND_DIR, 'washhouse-icon.png')
    icon_img.save(icon_path, 'PNG', optimize=True)
    print('Icon:', icon_img.size, 'box', box, '->', icon_path)

    save_ico(os.path.join(PUBLIC_DIR, 'favicon.ico'), icon_img)
    for name, size in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)]:
        sq = make_square_icon(icon_img, size)
        p = os.path.join(PUBLIC_DIR, name)
        sq.save(p, 'PNG', optimize=True)
        print('Saved', name, size)

    print('DONE — full aspect:', full.size[0] / full.size[1])
    print('DONE — icon aspect:', icon_img.size[0] / icon_img.size[1])


if __name__ == '__main__':
    main()
