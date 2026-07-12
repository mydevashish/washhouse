#!/usr/bin/env python3
"""Generate minimal PWA PNG icons (requires Pillow: pip install pillow)."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Install Pillow: pip install pillow")
    raise SystemExit(1)

OUT = Path(__file__).resolve().parents[1] / "frontend" / "public"
BRAND = (99, 102, 241)


def make_icon(size: int, path: Path) -> None:
    img = Image.new("RGB", (size, size), BRAND)
    draw = ImageDraw.Draw(img)
    margin = size // 6
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 8,
        fill=(255, 255, 255),
    )
    img.save(path, "PNG")
    print(f"Wrote {path}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon(192, OUT / "icon-192.png")
    make_icon(512, OUT / "icon-512.png")


if __name__ == "__main__":
    main()
