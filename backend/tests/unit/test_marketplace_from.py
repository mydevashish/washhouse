"""Unit tests for marketplace-from coalesce / serialize helpers."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from app.models.catalog import PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit
from app.services.marketplace_from_service import _coalesce_from, _serialize_item


def test_coalesce_prefers_aggregate_over_suggested() -> None:
    value, used = _coalesce_from(Decimal("50.00"), Decimal("69.00"))
    assert value == Decimal("50.00")
    assert used is True


def test_coalesce_falls_back_to_suggested() -> None:
    value, used = _coalesce_from(None, Decimal("69.00"))
    assert value == Decimal("69.00")
    assert used is False


def test_serialize_suggested_dual() -> None:
    item = PlatformCatalogItem(
        id=uuid4(),
        slug="men-shirt-tshirt",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    row = _serialize_item(item, None)
    assert row is not None
    assert row.source == "suggested"
    assert row.from_dry_clean_inr == "69.00"
    assert row.from_press_inr == "15.00"
    assert row.from_price_inr is None


def test_serialize_aggregate_min() -> None:
    item = PlatformCatalogItem(
        id=uuid4(),
        slug="men-shirt-tshirt",
        name="Shirt / T-shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69.00"),
        suggested_press_inr=Decimal("15.00"),
        sort_order=10,
    )
    row = _serialize_item(item, (Decimal("55.00"), Decimal("12.00"), None))
    assert row is not None
    assert row.source == "aggregate"
    assert row.from_dry_clean_inr == "55.00"
    assert row.from_press_inr == "12.00"


def test_serialize_omits_deferred_unpriced() -> None:
    item = PlatformCatalogItem(
        id=uuid4(),
        slug="household-curtain-panel",
        name="Curtain (per panel)",
        category=CatalogCategory.household,
        unit=CatalogUnit.panel,
        sort_order=99,
    )
    assert _serialize_item(item, None) is None
