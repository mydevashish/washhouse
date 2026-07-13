"""Posterize icon then vectorize for a smaller SVG."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import vtracer
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICON = ROOT / "public" / "brand" / "washhouse-icon.png"
TMP = ROOT / "public" / "brand" / "_washhouse-icon-poster.png"
OUT = ROOT / "public" / "brand" / "washhouse-icon.svg"

PALETTE = [
    (30, 58, 138),
    (29, 78, 216),
    (37, 99, 235),
    (8, 104, 184),
    (8, 145, 178),
    (6, 182, 212),
    (34, 211, 238),
    (8, 200, 200),
]
PAL = np.array(PALETTE, dtype=np.float32)


def nearest(rgb: np.ndarray) -> tuple[int, int, int]:
    idx = int(np.argmin(np.sum((PAL - rgb) ** 2, axis=1)))
    return PALETTE[idx]


def main() -> None:
    arr = np.array(Image.open(ICON).convert("RGBA"))
    out = arr.copy()
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            if arr[y, x, 3] < 128:
                out[y, x] = (0, 0, 0, 0)
                continue
            r, g, b = arr[y, x, :3]
            if r > 220 and g > 220 and b > 220:
                out[y, x] = (0, 0, 0, 0)
                continue
            nr, ng, nb = nearest(arr[y, x, :3].astype(np.float32))
            out[y, x] = (nr, ng, nb, 255)

    Image.fromarray(out).save(TMP)
    vtracer.convert_image_to_svg_py(
        str(TMP),
        str(OUT),
        colormode="color",
        hierarchical="stacked",
        mode="polygon",
        filter_speckle=12,
        color_precision=2,
        layer_difference=48,
        corner_threshold=90,
        length_threshold=12.0,
        path_precision=1,
    )
    TMP.unlink(missing_ok=True)
    print("bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
