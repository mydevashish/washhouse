"""Idempotent WashHouse suggested defaults → platform_catalog_items.

These are platform suggested rates only — never auto-copied as live laundry prices.
Partners start with empty overrides; Slice B adds an explicit “Apply suggested prices” action.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit

# (slug, name, category, unit, dry_clean, press, price, sort_order)
# Dual: dry_clean / press (press None = N/A). Single: price only (by-kg / household no-press).
SeedRow = tuple[
    str,
    str,
    CatalogCategory,
    CatalogUnit,
    Decimal | None,
    Decimal | None,
    Decimal | None,
    int,
]


def _d(value: int | float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def _dual(
    slug: str,
    name: str,
    category: CatalogCategory,
    dry: int | float,
    press: int | float | None,
    sort: int,
    *,
    unit: CatalogUnit = CatalogUnit.piece,
) -> SeedRow:
    return (slug, name, category, unit, _d(dry), _d(press), None, sort)


def _single(
    slug: str,
    name: str,
    category: CatalogCategory,
    price: int | float | None,
    sort: int,
    *,
    unit: CatalogUnit = CatalogUnit.piece,
) -> SeedRow:
    return (slug, name, category, unit, None, None, _d(price), sort)


def washhouse_seed_rows() -> list[SeedRow]:
    """The WashHouse appendix — suggested INR defaults for the platform catalog."""
    rows: list[SeedRow] = []
    s = 10

    # --- laundry_by_kg ---
    rows.append(
        _single(
            "kg-wash-fold",
            "Wash & Fold",
            CatalogCategory.laundry_by_kg,
            79,
            s,
            unit=CatalogUnit.kg,
        )
    )
    s += 10
    rows.append(
        _single(
            "kg-wash-iron",
            "Wash & Iron",
            CatalogCategory.laundry_by_kg,
            109,
            s,
            unit=CatalogUnit.kg,
        )
    )
    s += 10

    # --- men ---
    men = [
        ("men-shirt-tshirt", "Shirt / T-shirt", 69, 15),
        ("men-trouser-jeans", "Trouser / Jeans", 79, 15),
        ("men-lower", "Lower", 69, 15),
        ("men-jogger-cargo", "Jogger / Cargo", 79, 15),
        ("men-shorts", "Shorts", 59, 15),
        ("men-dhoti-lungi", "Dhoti / Lungi", 79, 25),
        ("men-kurta", "Kurta", 79, 25),
        ("men-cap-fabric", "Cap (fabric)", 39, None),
        ("men-cap-leather", "Cap (leather)", 89, None),
        ("men-turban", "Turban", 99, 39),
        ("men-sherwani-cotton", "Sherwani (cotton)", 219, 59),
        ("men-sherwani-wedding", "Sherwani (wedding)", 499, 99),
        ("men-coat-formal", "Coat (formal)", 149, 39),
        ("men-coat-heavy", "Coat (heavy)", 199, 49),
        ("men-suit-2pcs", "Suit 2 pcs", 249, 59),
        ("men-suit-3pcs", "Suit 3 pcs", 299, 69),
        ("men-vest", "Vest", 39, 15),
        ("men-waistcoat", "Waistcoat", 99, 35),
        ("men-wallet", "Wallet", 49, None),
        ("men-tie", "Tie", 39, 10),
        ("men-hanky", "Hanky", 10, None),
    ]
    for slug, name, dry, press in men:
        rows.append(_dual(slug, name, CatalogCategory.men, dry, press, s))
        s += 10

    # --- women ---
    women = [
        ("women-saree-normal", "Saree (normal)", 139, 49),
        ("women-saree-heavy", "Saree (heavy)", 299, 99),
        ("women-lehenga-normal", "Lehenga (normal)", 399, 49),
        ("women-lehenga-heavy", "Lehenga (heavy)", 449, 99),
        ("women-blouse-choli-normal", "Blouse / Choli (normal)", 49, 15),
        ("women-blouse-choli-heavy", "Blouse / Choli (heavy)", 69, 25),
        ("women-gown-anarkali", "Gown / Anarkali", 399, 119),
        ("women-skirt-short", "Skirt (short)", 69, 15),
        ("women-skirt-long", "Skirt (long)", 129, 39),
        ("women-full-dress-normal", "Full Dress (normal)", 89, 20),
        ("women-full-dress-party", "Full Dress (party)", 249, 69),
        ("women-top-kurti", "Top / Kurti", 69, 15),
        ("women-dupatta", "Dupatta", 59, 15),
        ("women-frock-normal", "Frock (normal)", 129, 39),
        ("women-frock-heavy", "Frock (heavy)", 199, 49),
        ("women-petticoat", "Petticoat", 39, 15),
        ("women-kameez-normal", "Kameez (normal)", 79, 20),
        ("women-kameez-fancy", "Kameez (fancy)", 139, 39),
        ("women-burkha", "Burkha", 99, 29),
        ("women-patiala-salwar", "Patiala / Salwar", 79, 20),
        ("women-kurta", "Kurta", 79, 20),
        ("women-bathrobe", "Bathrobe", 99, 39),
        ("women-purse-s", "Purse S", 99, None),
        ("women-purse-m", "Purse M", 149, None),
        ("women-purse-l", "Purse L", 299, None),
    ]
    for slug, name, dry, press in women:
        rows.append(_dual(slug, name, CatalogCategory.women, dry, press, s))
        s += 10

    # --- kids ---
    kids = [
        ("kids-shirt-tshirt", "Shirt / T-shirt", 59, 15),
        ("kids-trouser-jeans", "Trouser / Jeans", 69, 15),
        ("kids-lower", "Lower", 59, 15),
        ("kids-jogger-cargo", "Jogger / Cargo", 69, 15),
        ("kids-shorts", "Shorts", 49, 15),
        ("kids-dhoti-lungi", "Dhoti / Lungi", 59, 20),
        ("kids-kurta", "Kurta", 59, 20),
        ("kids-sherwani-cotton", "Sherwani (cotton)", 179, 49),
        ("kids-sherwani-wedding", "Sherwani (wedding)", 399, 79),
        ("kids-coat-formal", "Coat (formal)", 119, 29),
        ("kids-coat-heavy", "Coat (heavy)", 149, 39),
        ("kids-suit-2pcs", "Suit 2 pcs", 179, 49),
        ("kids-suit-3pcs", "Suit 3 pcs", 219, 59),
        ("kids-waistcoat", "Waistcoat", 69, 25),
        ("kids-skirt", "Skirt", 59, 15),
        ("kids-girl-dress", "Girl Dress", 79, 20),
        ("kids-dupatta", "Dupatta", 49, 15),
        ("kids-frock", "Frock", 99, 25),
        ("kids-full-jacket-normal", "Full jacket (normal)", 129, 39),
        ("kids-full-jacket-leather", "Full jacket (leather)", 299, 59),
        ("kids-half-jacket-normal", "Half jacket (normal)", 109, 29),
        ("kids-half-jacket-leather", "Half jacket (leather)", 249, 59),
    ]
    for slug, name, dry, press in kids:
        rows.append(_dual(slug, name, CatalogCategory.kids, dry, press, s))
        s += 10

    # --- winter ---
    winter = [
        ("winter-sweater-kids", "Sweater (kids)", 99, 19),
        ("winter-sweater-men-women", "Sweater (men/women)", 149, 29),
        ("winter-overcoat-kids", "Overcoat (kids)", 149, 29),
        ("winter-overcoat-men-women", "Overcoat (men/women)", 199, 49),
        ("winter-overcoat-leather", "Overcoat (leather)", 499, 99),
        ("winter-jacket-cotton-denim", "Jacket (cotton/denim)", 149, 49),
        ("winter-jacket-puffer", "Jacket (puffer)", 199, 59),
        ("winter-jacket-leather", "Jacket (leather)", 299, 89),
        ("winter-half-jacket-cotton-denim", "Half Jacket (cotton/denim)", 119, 29),
        ("winter-half-jacket-puffer", "Half Jacket (puffer)", 149, 39),
        ("winter-half-jacket-leather", "Half Jacket (leather)", 249, 79),
        ("winter-shawl", "Shawl", 89, 25),
        ("winter-cap", "Winter Cap", 49, None),
        ("winter-hoodie", "Hoodie", 169, 49),
    ]
    for slug, name, dry, press in winter:
        rows.append(_dual(slug, name, CatalogCategory.winter, dry, press, s))
        s += 10

    # --- household: dual when press applies; single (price_inr) when dry-clean-only ---
    household_dual = [
        ("household-bedsheet-single", "Bedsheet single", 99, 29),
        ("household-bedsheet-double", "Bedsheet double", 149, 39),
    ]
    for slug, name, dry, press in household_dual:
        rows.append(_dual(slug, name, CatalogCategory.household, dry, press, s))
        s += 10

    household_single = [
        ("household-blanket-4x6", "Blanket 4×6", 169),
        ("household-blanket-double", "Blanket double", 299),
        ("household-blanket-king", "Blanket king", 349),
        ("household-toy-s", "Toy S", 99),
        ("household-toy-m", "Toy M", 149),
        ("household-toy-l", "Toy L", 299),
        ("household-pillow-cushion-cover", "Pillow / Cushion Cover", 29),
        ("household-shoes-sports", "Shoes (sports)", 249),
        ("household-shoes-leather", "Shoes (leather)", 349),
        ("household-heels", "Heels", 299),
        ("household-bag-small", "Bag small", 149),
        ("household-bag-large", "Bag large", 299),
        ("household-trolley-s", "Trolley S", 199),
        ("household-trolley-m", "Trolley M", 299),
        ("household-trolley-l", "Trolley L", 399),
        ("household-carpet-s", "Carpet S", 79),
        ("household-carpet-m", "Carpet M", 149),
        ("household-carpet-l", "Carpet L", 219),
        ("household-bath-towel", "Bath Towel", 59),
        ("household-comforter-single", "Comforter single", 249),
        ("household-comforter-double", "Comforter double", 349),
        ("household-gloves-cotton", "Gloves cotton", 39),
        ("household-gloves-leather", "Gloves leather", 89),
        # Deferred rates — catalog row present, suggested null until product confirms.
        ("household-curtain-panel", "Curtain (per panel)", None),
    ]
    for slug, name, price in household_single:
        unit = CatalogUnit.panel if slug == "household-curtain-panel" else CatalogUnit.piece
        rows.append(_single(slug, name, CatalogCategory.household, price, s, unit=unit))
        s += 10

    return rows


async def ensure_washhouse_catalog(session: AsyncSession) -> dict[str, Any]:
    """Upsert WashHouse suggested defaults by slug. Does not touch laundry_item_prices."""
    created = 0
    updated = 0
    for slug, name, category, unit, dry, press, price, sort_order in washhouse_seed_rows():
        existing = await session.scalar(
            select(PlatformCatalogItem).where(
                PlatformCatalogItem.slug == slug,
                PlatformCatalogItem.deleted_at.is_(None),
            ),
        )
        if existing is None:
            session.add(
                PlatformCatalogItem(
                    slug=slug,
                    name=name,
                    category=category,
                    unit=unit,
                    suggested_dry_clean_inr=dry,
                    suggested_press_inr=press,
                    suggested_price_inr=price,
                    currency="INR",
                    sort_order=sort_order,
                    is_active=True,
                ),
            )
            created += 1
            continue

        existing.name = name
        existing.category = category
        existing.unit = unit
        existing.suggested_dry_clean_inr = dry
        existing.suggested_press_inr = press
        existing.suggested_price_inr = price
        existing.sort_order = sort_order
        existing.is_active = True
        existing.currency = "INR"
        updated += 1

    await session.flush()
    return {"created": created, "updated": updated, "total": created + updated}
