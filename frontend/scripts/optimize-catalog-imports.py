"""Batch-convert dropped JPG/PNG imports into production catalog WebP tiles.

Reads ``public/catalog/_imports/<category>/`` and writes 1200×900 WebP (q85)
to ``public/catalog/<category>/``. Optional ``--marketing`` processes
``public/marketing/_imports/`` into 1920×1080 hero WebPs.

Idempotent: skips outputs newer than their source unless ``--force``.

Requires Pillow (same as ``extract-catalog-photos.py``). ``--remove-bg`` uses
edge flood-fill near-white punch-out by default; pass ``--remove-bg-engine rembg``
when rembg + onnxruntime are installed.

Commands::

    cd frontend
    npm run catalog:optimize -- --force
    npm run catalog:optimize -- --remove-bg --force
    npm run catalog:optimize -- --from-sample --remove-bg --force
    # --from-sample: map public/sample/ -> _imports PNG (alpha), encode WebP,
    # delete successfully mapped samples, write public/sample/SKIPPED.md
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from catalog_photo_utils import (  # noqa: E402
    DEFAULT_WEBP_QUALITY,
    TILE_HEIGHT,
    TILE_WIDTH,
    remove_background,
    save_catalog_webp,
)

FRONTEND_DIR = SCRIPT_DIR.parent
CATALOG_DIR = FRONTEND_DIR / 'public' / 'catalog'
CATALOG_IMPORTS_DIR = CATALOG_DIR / '_imports'
MARKETING_DIR = FRONTEND_DIR / 'public' / 'marketing'
MARKETING_IMPORTS_DIR = MARKETING_DIR / '_imports'
MARKETING_HEROES_DIR = MARKETING_DIR / 'heroes'
SAMPLE_DIR = FRONTEND_DIR / 'public' / 'sample'

SUPPORTED_EXTENSIONS = frozenset({'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff'})
MAX_SOURCE_DIMENSION = 8000

MARKETING_WIDTH = 1920
MARKETING_HEIGHT = 1080
MARKETING_QUALITY = 82

# Approved sample → catalog mapping (replace-existing only; skips listed separately).
# Keys are filenames under public/sample/; values are (category, kebab stem).
SAMPLE_MAPPING: dict[str, tuple[str, str]] = {
    'Anarkali.webp': ('women', 'gown'),
    'Bag.webp': ('accessories', 'school-bag'),
    'Bedsheet.webp': ('household', 'bedsheet'),
    'Burkha.webp': ('women', 'burkha'),
    'Cap.webp': ('men', 'cap-fabric'),
    'Cargo.webp': ('men', 'jogger'),
    'Coat.webp': ('men', 'coat-formal'),
    'Curtain.webp': ('household', 'curtain'),
    'Dupatta.webp': ('women', 'dupatta'),
    'Gloves.webp': ('accessories', 'gloves-cotton'),
    'Half jacket.webp': ('winter', 'half-jacket-cotton-denim'),
    'Heels.webp': ('accessories', 'heels'),
    'Hoodie.webp': ('winter', 'hoodie'),
    'Jacket.webp': ('winter', 'jacket-cotton-denim'),
    'Jeans.webp': ('men', 'trouser'),
    'Kids girl dress.webp': ('kids', 'girl-dress'),
    'Leather jacket.webp': ('winter', 'jacket-leather'),
    'Leatherbag.webp': ('accessories', 'backpack'),
    'Lower.webp': ('men', 'lower'),
    'Lungi.webp': ('men', 'dhoti'),
    'Men kurta.webp': ('men', 'kurta'),
    'Overcoat.webp': ('winter', 'overcoat-men-women'),
    'Pillow cover.webp': ('household', 'pillow-cover'),
    'Purse.webp': ('accessories', 'handbag'),
    'Saare heavy.webp': ('women', 'saree-heavy'),
    'Saree normal.webp': ('women', 'saree-normal'),
    'Shawl.webp': ('winter', 'shawl'),
    'Shirt.webp': ('men', 'shirt'),
    'Shoes.webp': ('accessories', 'shoes'),
    'Shorts.webp': ('men', 'shorts'),
    'Skirt large.webp': ('women', 'skirt-long'),
    'Skirt small.webp': ('women', 'skirt-short'),
    'Sweater.webp': ('winter', 'sweater'),
    'Tie.webp': ('men', 'tie'),
    'Towel.webp': ('household', 'towel'),
    'Trolley bag.webp': ('accessories', 'trolley-m'),
    'Women full dress.webp': ('women', 'full-dress-party'),
    'Women kurta.webp': ('women', 'kurta'),
    'Women short dress.webp': ('women', 'full-dress-normal'),
    '4bxt1B1204uOy-d._SL360_QL95_FMwebp_.webp': ('women', 'top-kurti'),
    'abxt1hjw-XuUDdJ._SL360_QL95_FMwebp_.webp': ('women', 'kameez-normal'),
    'xbxt1xE$1UHxodK._SL360_QL95_FMwebp_.webp': ('women', 'frock-normal'),
}

SAMPLE_SKIPPED: dict[str, str] = {
    'Shocks.webp': 'No socks/shocks seed slug or manifest row.',
    'Tshirt.webp': 'Same tile as Shirt.webp (men/shirt.webp); prefer dress-shirt sample.',
    'Pbxt1BNiDJSisrR._SL360_QL95_FMwebp_.webp': (
        'Second men kurta; prefer named Men kurta.webp for men/kurta.webp.'
    ),
    'fbxt1hTbpb8e24L._SL360_QL95_FMwebp_.webp': (
        'Second short skirt; prefer Skirt small.webp for women/skirt-short.webp.'
    ),
}


def to_kebab_stem(filename: str) -> str:
    """Normalize a filename stem to kebab-case."""
    stem = Path(filename).stem
    normalized = stem.replace('_', ' ').replace('-', ' ')
    normalized = re.sub(r'[^\w\s-]', '', normalized, flags=re.UNICODE)
    normalized = re.sub(r'\s+', '-', normalized.strip().lower())
    return re.sub(r'-+', '-', normalized).strip('-')


def is_up_to_date(src: Path, out_path: Path) -> bool:
    if not out_path.is_file():
        return False
    return out_path.stat().st_mtime >= src.stat().st_mtime


def log_oversized(src: Path, img: Image.Image, *, label: str) -> None:
    width, height = img.size
    longest = max(width, height)
    if longest > MAX_SOURCE_DIMENSION:
        print(
            f'  WARN oversized ({width}×{height}, longest {longest}px > {MAX_SOURCE_DIMENSION}): {label}',
            file=sys.stderr,
        )


def crop_cover(
    img: Image.Image,
    *,
    width: int,
    height: int,
    focal_y: float = 0.5,
) -> Image.Image:
    """Cover-crop to *width*×*height* with optional vertical focal point (0–1)."""
    rgb = img.convert('RGB')
    target_ratio = width / height
    src_ratio = rgb.width / rgb.height

    if src_ratio > target_ratio:
        crop_h = rgb.height
        crop_w = round(crop_h * target_ratio)
        left = (rgb.width - crop_w) // 2
        top = 0
    else:
        crop_w = rgb.width
        crop_h = round(crop_w / target_ratio)
        left = 0
        max_top = rgb.height - crop_h
        top = round(max_top * focal_y)

    cropped = rgb.crop((left, top, left + crop_w, top + crop_h))
    if cropped.size != (width, height):
        return cropped.resize((width, height), Image.Resampling.LANCZOS)
    return cropped


def iter_import_files(imports_dir: Path) -> list[Path]:
    if not imports_dir.is_dir():
        return []
    return sorted(
        path
        for path in imports_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def prepare_image(img: Image.Image, *, remove_bg: bool, engine: str = 'flood') -> Image.Image:
    return remove_background(img, engine=engine) if remove_bg else img


def export_transparent_png(img: Image.Image, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.convert('RGBA').save(out_path, 'PNG', optimize=True)


def process_catalog_imports(
    *,
    force: bool,
    quality: int,
    remove_bg: bool,
    bg_engine: str = 'flood',
) -> tuple[int, int, int]:
    """Returns (written, skipped, warned_oversized)."""
    if not CATALOG_IMPORTS_DIR.is_dir():
        print(f'No catalog imports folder at {CATALOG_IMPORTS_DIR.relative_to(FRONTEND_DIR)}/')
        print('Create public/catalog/_imports/<category>/ and drop JPG/PNG files there.')
        return 0, 0, 0

    written = 0
    skipped = 0
    oversized = 0

    category_dirs = sorted(path for path in CATALOG_IMPORTS_DIR.iterdir() if path.is_dir())
    if not category_dirs:
        print(f'No category folders under {CATALOG_IMPORTS_DIR.relative_to(FRONTEND_DIR)}/')
        return 0, 0, 0

    bg_note = f' + remove-bg ({bg_engine})' if remove_bg else ''
    print(f'Catalog imports -> {TILE_WIDTH}×{TILE_HEIGHT} WebP q{quality}{bg_note}')

    for category_dir in category_dirs:
        category = category_dir.name
        out_dir = CATALOG_DIR / category
        files = iter_import_files(category_dir)

        if not files:
            print(f'  {category}/ — no supported images, skipping folder')
            continue

        for src in files:
            rel = src.relative_to(CATALOG_IMPORTS_DIR)
            stem = to_kebab_stem(src.name)
            if not stem:
                print(f'  SKIP (empty name): {rel}', file=sys.stderr)
                skipped += 1
                continue

            out_name = f'{stem}.webp'
            out_path = out_dir / out_name

            if not force and is_up_to_date(src, out_path):
                print(f'  SKIP (up to date): {category}/{out_name}')
                skipped += 1
                continue

            try:
                with Image.open(src) as img:
                    log_oversized(src, img, label=str(rel))
                    if max(img.size) > MAX_SOURCE_DIMENSION:
                        oversized += 1
                    prepared = prepare_image(img, remove_bg=remove_bg, engine=bg_engine)
                    save_catalog_webp(prepared, out_path, quality=quality)
            except OSError as exc:
                print(f'  SKIP (unreadable): {rel} — {exc}', file=sys.stderr)
                skipped += 1
                continue

            with Image.open(out_path) as saved:
                kb = out_path.stat().st_size / 1024
                print(
                    f'  {src.name:32} -> {category}/{out_name} '
                    f'({saved.size[0]}×{saved.size[1]}, {kb:.0f} KB)'
                )
            written += 1

    return written, skipped, oversized


def process_marketing_imports(*, force: bool, quality: int) -> tuple[int, int, int]:
    """Returns (written, skipped, warned_oversized)."""
    if not MARKETING_IMPORTS_DIR.is_dir():
        print(f'No marketing imports folder at {MARKETING_IMPORTS_DIR.relative_to(FRONTEND_DIR)}/')
        return 0, 0, 0

    files = iter_import_files(MARKETING_IMPORTS_DIR)
    if not files:
        print(f'No supported images in {MARKETING_IMPORTS_DIR.relative_to(FRONTEND_DIR)}/')
        return 0, 0, 0

    written = 0
    skipped = 0
    oversized = 0

    MARKETING_HEROES_DIR.mkdir(parents=True, exist_ok=True)
    print(f'Marketing imports -> {MARKETING_WIDTH}×{MARKETING_HEIGHT} WebP q{quality}')

    for src in files:
        rel = src.relative_to(MARKETING_IMPORTS_DIR)
        stem = to_kebab_stem(src.name)
        if not stem:
            print(f'  SKIP (empty name): {rel}', file=sys.stderr)
            skipped += 1
            continue

        out_name = f'{stem}.webp'
        out_path = MARKETING_HEROES_DIR / out_name

        if not force and is_up_to_date(src, out_path):
            print(f'  SKIP (up to date): heroes/{out_name}')
            skipped += 1
            continue

        try:
            with Image.open(src) as img:
                log_oversized(src, img, label=str(rel))
                if max(img.size) > MAX_SOURCE_DIMENSION:
                    oversized += 1
                hero = crop_cover(
                    img,
                    width=MARKETING_WIDTH,
                    height=MARKETING_HEIGHT,
                )
                out_path.parent.mkdir(parents=True, exist_ok=True)
                hero.save(out_path, 'WEBP', quality=quality, method=6)
        except OSError as exc:
            print(f'  SKIP (unreadable): {rel} — {exc}', file=sys.stderr)
            skipped += 1
            continue

        with Image.open(out_path) as saved:
            kb = out_path.stat().st_size / 1024
            print(
                f'  {src.name:32} -> heroes/{out_name} '
                f'({saved.size[0]}×{saved.size[1]}, {kb:.0f} KB)'
            )
        written += 1

    return written, skipped, oversized


def import_samples_to_catalog(
    *,
    remove_bg: bool,
    bg_engine: str = 'flood',
) -> tuple[list[Path], list[str]]:
    """Write transparent PNGs into _imports from approved SAMPLE_MAPPING.

    Returns (successfully_mapped_sample_paths, error_labels).
    """
    if not SAMPLE_DIR.is_dir():
        print(f'No sample folder at {SAMPLE_DIR.relative_to(FRONTEND_DIR)}/', file=sys.stderr)
        return [], ['missing sample dir']

    bg_label = f'remove-bg ({bg_engine})' if remove_bg else 'no bg removal'
    print(f'Sample import -> {CATALOG_IMPORTS_DIR.relative_to(FRONTEND_DIR)}/ ({bg_label})')

    ok_paths: list[Path] = []
    errors: list[str] = []

    for filename, (category, stem) in sorted(SAMPLE_MAPPING.items()):
        src = SAMPLE_DIR / filename
        if not src.is_file():
            msg = f'missing: {filename}'
            print(f'  SKIP {msg}', file=sys.stderr)
            errors.append(msg)
            continue

        out_png = CATALOG_IMPORTS_DIR / category / f'{stem}.png'
        try:
            with Image.open(src) as img:
                prepared = prepare_image(img, remove_bg=remove_bg, engine=bg_engine)
                export_transparent_png(prepared, out_png)
        except OSError as exc:
            msg = f'{filename}: {exc}'
            print(f'  SKIP (unreadable): {msg}', file=sys.stderr)
            errors.append(msg)
            continue

        print(f'  {filename:42} -> _imports/{category}/{stem}.png')
        ok_paths.append(src)

    return ok_paths, errors


def write_skipped_md(*, remaining: list[str]) -> Path:
    """Write SKIPPED.md for files left in sample/ after successful mapping cleanup."""
    lines = [
        '# Skipped sample files',
        '',
        'Left in `public/sample/` after catalog import. Not deleted.',
        '',
        '| sample filename | reason |',
        '| --- | --- |',
    ]
    for name in remaining:
        reason = SAMPLE_SKIPPED.get(name, 'Not in approved replace mapping (or import failed).')
        lines.append(f'| `{name}` | {reason} |')
    lines.append('')
    out = SAMPLE_DIR / 'SKIPPED.md'
    out.write_text('\n'.join(lines), encoding='utf-8')
    return out


def cleanup_mapped_samples(mapped: list[Path]) -> None:
    for path in mapped:
        try:
            path.unlink(missing_ok=True)
            print(f'  deleted sample: {path.name}')
        except OSError as exc:
            print(f'  WARN could not delete {path.name}: {exc}', file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--marketing',
        action='store_true',
        help='Also process public/marketing/_imports/ into public/marketing/heroes/',
    )
    parser.add_argument(
        '--marketing-only',
        action='store_true',
        help='Process only marketing imports (skip catalog)',
    )
    parser.add_argument('--force', action='store_true', help='Re-encode even when output is newer')
    parser.add_argument('--quality', type=int, default=DEFAULT_WEBP_QUALITY, help='WebP quality (catalog)')
    parser.add_argument(
        '--marketing-quality',
        type=int,
        default=MARKETING_QUALITY,
        help='WebP quality for marketing heroes',
    )
    parser.add_argument(
        '--remove-bg',
        action='store_true',
        help='Remove near-white background before compositing (also used by --from-sample)',
    )
    parser.add_argument(
        '--remove-bg-engine',
        choices=('flood', 'rembg'),
        default='flood',
        help='Background removal engine when --remove-bg / --from-sample (default: flood)',
    )
    parser.add_argument(
        '--from-sample',
        action='store_true',
        help=(
            'Import approved public/sample/ mapping into _imports as transparent PNG, '
            'encode catalog WebP, delete mapped samples, write SKIPPED.md'
        ),
    )
    args = parser.parse_args()

    total_written = 0
    total_skipped = 0
    total_oversized = 0
    mapped_samples: list[Path] = []

    if args.from_sample:
        # Always write alpha PNGs for samples (step 1).
        mapped_samples, import_errors = import_samples_to_catalog(
            remove_bg=True,
            bg_engine=args.remove_bg_engine,
        )
        if import_errors and not mapped_samples:
            print('No samples imported; aborting.', file=sys.stderr)
            return 1
        # PNGs already have alpha — composite only (do not re-punch).
        written, skipped, oversized = process_catalog_imports(
            force=True,
            quality=args.quality,
            remove_bg=False,
        )
        total_written += written
        total_skipped += skipped
        total_oversized += oversized

        cleanup_mapped_samples(mapped_samples)
        remaining = sorted(
            p.name
            for p in SAMPLE_DIR.iterdir()
            if p.is_file()
            and p.suffix.lower() in SUPPORTED_EXTENSIONS
            and p.name not in {m.name for m in mapped_samples}
        )
        skipped_path = write_skipped_md(remaining=remaining)
        print(f'Wrote {skipped_path.relative_to(FRONTEND_DIR)} ({len(remaining)} left in sample/)')
    elif not args.marketing_only:
        written, skipped, oversized = process_catalog_imports(
            force=args.force,
            quality=args.quality,
            remove_bg=args.remove_bg,
            bg_engine=args.remove_bg_engine,
        )
        total_written += written
        total_skipped += skipped
        total_oversized += oversized

    if args.marketing or args.marketing_only:
        written, skipped, oversized = process_marketing_imports(
            force=args.force,
            quality=args.marketing_quality,
        )
        total_written += written
        total_skipped += skipped
        total_oversized += oversized

    print(
        f'DONE — wrote {total_written}, skipped {total_skipped}'
        + (f', {total_oversized} oversized source(s)' if total_oversized else '')
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
