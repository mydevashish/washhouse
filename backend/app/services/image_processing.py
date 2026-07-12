"""Image compression utilities for evidence uploads."""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageOps

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
COMPRESSED_MAX_WIDTH = 1280
COMPRESSED_JPEG_QUALITY = 82


def validate_image_bytes(raw: bytes, content_type: str | None) -> None:
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Only JPEG, PNG, or WebP images are allowed")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError("Each image must be 10 MB or smaller")
    if len(raw) < 64:
        raise ValueError("Image file is too small")


def extension_for_content_type(content_type: str | None) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/heic": ".jpg",
        "image/heif": ".jpg",
    }.get(content_type or "", ".jpg")


def write_original(raw: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(raw)


def write_compressed(raw: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(raw)) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        width, height = img.size
        if width > COMPRESSED_MAX_WIDTH:
            ratio = COMPRESSED_MAX_WIDTH / width
            img = img.resize((COMPRESSED_MAX_WIDTH, int(height * ratio)), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=COMPRESSED_JPEG_QUALITY, optimize=True)
        dest.write_bytes(out.getvalue())
