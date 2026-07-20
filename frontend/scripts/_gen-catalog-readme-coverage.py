"""Generate coverage tables for public/catalog/README.md."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

manifest = json.loads((ROOT / "public/catalog/manifest.json").read_text(encoding="utf-8"))
by_slug = {i["slug"]: i for i in manifest["items"]}
manifest_keys = sorted({i["key"] for i in manifest["items"]})

ts = (ROOT / "features/marketing/pricing/pricing-product-images.ts").read_text(encoding="utf-8")
pricing_keys = sorted(set(re.findall(r"^\s+(\w+):\s*\{", ts, re.M)))

special_items = re.findall(
    r"id: '([^']+)'.*?slug: '([^']+)'.*?label: '([^']+)'",
    (ROOT / "features/marketing/home/special-care-items.ts").read_text(encoding="utf-8"),
    re.S,
)
service_items = re.findall(
    r"id: '([^']+)'.*?slug: '([^']+)'.*?title: '([^']+)'",
    (ROOT / "features/marketing/home/services-data.ts").read_text(encoding="utf-8"),
    re.S,
)

# Marketing → nearest catalog slug
SPECIAL_MAP = {
    "wedding-sherwani": ("men-sherwani-wedding", "Wedding sherwani tile"),
    "wedding-dresses": ("women-lehenga-heavy", "No wedding-dress tile — lehenga heavy"),
    "lehengas": ("women-lehenga-normal", None),
    "sarees": ("women-saree-normal", None),
    "suits": ("men-suit-2pcs", None),
    "leather-jackets": ("winter-jacket-leather", "Placeholder coat crop"),
    "shoes": ("household-shoes-sports", None),
    "curtains": ("household-curtain-panel", None),
    "blankets": ("household-blanket-double", None),
    "soft-toys": ("household-toy-m", None),
}

SERVICE_MAP = {
    "wash-fold": ("kg-wash-fold", None),
    "wash-iron": ("kg-wash-iron", None),
    "premium-laundry": ("service-professional-cleaning", "Marketing-only service slug"),
    "dry-clean": ("men-suit-2pcs", "Marketing-only — suit tile as stand-in"),
    "shoe-cleaning": ("household-shoes-sports", None),
    "curtain-cleaning": ("household-curtain-panel", None),
    "more-services": ("service-on-time-delivery", "Marketing-only catch-all"),
}


def yn(v: bool) -> str:
    return "yes" if v else "—"


def ph(slug: str) -> str:
    item = by_slug.get(slug)
    if not item:
        return "missing"
    if item.get("source") == "stock":
        return "stock"
    if item.get("placeholder"):
        return "placeholder"
    return "source"


lines: list[str] = []

lines.append("## Coverage (auto-generated)\n")
lines.append(
    "Last aligned with `seed_washhouse_catalog.py`, "
    "`pricing-product-images.ts`, `special-care-items.ts`, and `services-data.ts`.\n"
)

# Key comparison
lines.append("### Manifest `key` vs `PRICING_PRODUCT_PHOTOS`\n")
lines.append("| Key | In manifest | In pricing | Notes |")
lines.append("| --- | --- | --- | --- |")
all_keys = sorted(set(manifest_keys) | set(pricing_keys))
for key in all_keys:
    in_m = key in manifest_keys
    in_p = key in pricing_keys
    note = ""
    if in_m and not in_p:
        note = "Catalog-only (not in pricing map yet)"
    elif in_p and not in_m:
        note = "Pricing-only — no collage tile"
    lines.append(f"| `{key}` | {yn(in_m)} | {yn(in_p)} | {note} |")

# Special care
lines.append("\n### `SPECIAL_CARE_ITEMS` -> catalog\n")
lines.append("| Marketing slug | Label | Catalog slug | Tile | Notes |")
lines.append("| --- | --- | --- | --- | --- |")
for _id, slug, label in special_items:
    cat_slug, extra = SPECIAL_MAP[slug]
    item = by_slug[cat_slug]
    note = extra or item.get("note", "")
    if item.get("placeholder") and not note:
        note = f"Inherits `{item.get('cropFrom', '')}` crop"
    lines.append(f"| `{slug}` | {label} | `{cat_slug}` | {ph(cat_slug)} | {note} |")

# Service preview
lines.append("\n### `SERVICE_PREVIEW_ITEMS` -> catalog\n")
lines.append("| Marketing slug | Title | Catalog slug | Tile | Notes |")
lines.append("| --- | --- | --- | --- | --- |")
for _id, slug, title in service_items:
    cat_slug, extra = SERVICE_MAP[slug]
    item = by_slug[cat_slug]
    note = extra or item.get("note", "")
    if item.get("placeholder") and not note:
        note = f"Inherits `{item.get('cropFrom', '')}` crop"
    lines.append(f"| `{slug}` | {title} | `{cat_slug}` | {ph(cat_slug)} | {note} |")

# Seed summary
seed_py = (ROOT.parent / "backend/app/db/seed_washhouse_catalog.py").read_text(encoding="utf-8")
seed_slugs = sorted(
    set(re.findall(r'"((?:kg|men|women|kids|winter|household)-[a-z0-9-]+)"', seed_py))
)

lines.append("\n### Platform seed slugs (`seed_washhouse_catalog.py`)\n")
covered = sum(1 for s in seed_slugs if s in by_slug)
placeholders = sum(1 for s in seed_slugs if by_slug.get(s, {}).get("placeholder"))
stock = sum(1 for s in seed_slugs if by_slug.get(s, {}).get("source") == "stock")
source = covered - placeholders - stock
lines.append(
    f"- **{len(seed_slugs)}** seed slugs — **{covered}** in manifest "
    f"(**{stock}** stock, **{source}** collage crops, **{placeholders}** placeholders)\n"
)

lines.append("| Slug | `key` | Tile | `cropFrom` / note |")
lines.append("| --- | --- | --- | --- |")
for slug in seed_slugs:
    item = by_slug[slug]
    tile = ph(slug)
    ref = item.get("cropFrom", "")
    note = item.get("note", "")
    detail = ref if item.get("placeholder") else "—"
    if note:
        detail = f"{detail}; {note}" if detail != "—" else note
    lines.append(f"| `{slug}` | `{item['key']}` | {tile} | {detail} |")

# Extra manifest-only
extra = sorted(set(by_slug) - set(seed_slugs))
if extra:
    lines.append("\n### Manifest-only slugs (not in seed)\n")
    lines.append("| Slug | `key` | Purpose |")
    lines.append("| --- | --- | --- |")
    purpose = {
        "accessories-helmet": "Collage tile — not a priced catalog row",
        "household-pillow": "Legacy slug; seed uses `household-pillow-cushion-cover`",
        "household-pillow-cover": "Alias crop for pillow cover tile",
        "household-sofa-cover": "Collage tile — not in seed yet",
        "service-pickup-delivery": "Homepage service icon",
        "service-professional-cleaning": "Homepage service icon",
        "service-hygienic-safe": "Homepage service icon",
        "service-steam-ironing": "Homepage service icon",
        "service-quality-check": "Homepage service icon",
        "service-safe-packaging": "Homepage service icon",
        "service-on-time-delivery": "Homepage service icon",
    }
    for slug in extra:
        item = by_slug[slug]
        lines.append(f"| `{slug}` | `{item['key']}` | {purpose.get(slug, '')} |")

# Manual crops needed
manual = [i for i in manifest["items"] if i.get("placeholder")]
lines.append("\n### Manual crop follow-ups\n")
lines.append(
    f"**{len(manual)}** manifest rows use `placeholder: true` (inherited crops). "
    "Kids and winter placeholders are stock tiles now; remaining gaps: skirts/frocks, heels/trolleys/gloves.\n"
)
lines.append("| Slug | Inherits from | Note |")
lines.append("| --- | --- | --- |")
for item in manual:
    lines.append(
        f"| `{item['slug']}` | `{item.get('cropFrom', '')}` | {item.get('note', '')} |"
    )

out = ROOT / "public/catalog/README.md"
readme = out.read_text(encoding="utf-8")
block = "\n".join(lines) + "\n"
if "## Coverage" in readme:
    readme = readme.split("## Coverage")[0].rstrip() + "\n\n"
out.write_text(readme + block, encoding="utf-8")
print(f"Updated {out}")
