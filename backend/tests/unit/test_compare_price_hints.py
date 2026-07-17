"""Unit tests for discovery compare price hints (Slice 5)."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from app.repositories.catalog import LaundryComparePriceHints
from app.schemas.laundry import LaundryListItem
from app.utils.money import format_inr, inr_to_paise


def test_compare_hints_start_price_is_min_of_available() -> None:
    hints = LaundryComparePriceHints(
        wash_fold_inr=Decimal("79.00"),
        shirt_dry_clean_inr=Decimal("69.00"),
    )
    assert hints.start_price_inr == Decimal("69.00")


def test_compare_hints_start_price_single_column() -> None:
    assert LaundryComparePriceHints(wash_fold_inr=Decimal("79.00")).start_price_inr == Decimal(
        "79.00",
    )
    assert LaundryComparePriceHints(
        shirt_dry_clean_inr=Decimal("69.00"),
    ).start_price_inr == Decimal("69.00")


def test_compare_hints_start_price_empty() -> None:
    assert LaundryComparePriceHints().start_price_inr is None


def test_list_item_schema_defaults_null_hints() -> None:
    """List cards omit prices when the laundry has not published compare items."""
    item = LaundryListItem(
        id=uuid4(),
        name="Hintless",
        slug="hintless",
        city="Bengaluru",
        avg_rating=Decimal("4.50"),
        review_count=1,
        is_verified=True,
    )
    assert item.wash_fold_from_inr is None
    assert item.shirt_dry_clean_from_inr is None
    assert item.start_price_inr is None


def test_list_item_schema_formats_owner_prices() -> None:
    wash = Decimal("79.00")
    shirt = Decimal("69.00")
    start = min(wash, shirt)
    item = LaundryListItem(
        id=uuid4(),
        name="Priced",
        slug="priced",
        city="Bengaluru",
        avg_rating=Decimal("4.80"),
        review_count=10,
        is_verified=True,
        wash_fold_from_inr=format_inr(wash),
        wash_fold_from_paise=inr_to_paise(wash),
        shirt_dry_clean_from_inr=format_inr(shirt),
        shirt_dry_clean_from_paise=inr_to_paise(shirt),
        start_price_inr=format_inr(start),
        start_price_paise=inr_to_paise(start),
    )
    assert item.wash_fold_from_inr == "79.00"
    assert item.shirt_dry_clean_from_inr == "69.00"
    assert item.start_price_inr == "69.00"
    assert item.start_price_paise == 6900
