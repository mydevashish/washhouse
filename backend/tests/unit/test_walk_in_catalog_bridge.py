"""Unit tests for walk-in catalog process / price helpers (no DB)."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest

from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import CatalogCategory, CatalogUnit
from app.schemas.walk_in_order import WalkInCatalogProcess, WalkInOrderLineItemRequest
from app.services.walk_in_order_service import WalkInOrderService


def test_line_item_requires_exactly_one_source() -> None:
    with pytest.raises(Exception):
        WalkInOrderLineItemRequest(quantity=1)
    with pytest.raises(Exception):
        WalkInOrderLineItemRequest(
            service_id=uuid4(),
            catalog_item_id=uuid4(),
            quantity=1,
        )
    ok = WalkInOrderLineItemRequest(catalog_item_id=uuid4(), process=WalkInCatalogProcess.dry_clean, quantity=2)
    assert ok.catalog_item_id is not None


def test_resolve_process_defaults_to_dry_clean() -> None:
    item = PlatformCatalogItem(
        slug="men-shirt",
        name="Shirt",
        category=CatalogCategory.men,
        unit=CatalogUnit.piece,
        suggested_dry_clean_inr=Decimal("69"),
        suggested_press_inr=Decimal("15"),
    )
    override = LaundryItemPrice(
        laundry_id=uuid4(),
        catalog_item_id=uuid4(),
        dry_clean_inr=Decimal("69"),
        press_inr=Decimal("15"),
        is_offered=True,
    )
    process = WalkInOrderService._resolve_process(item, override, None)
    assert process == WalkInCatalogProcess.dry_clean
    assert WalkInOrderService._unit_price_for_process(override, process) == Decimal("69")


def test_service_display_name_includes_process() -> None:
    assert "Dry clean" in WalkInOrderService._service_display_name("Shirt", WalkInCatalogProcess.dry_clean)
    assert WalkInOrderService._service_display_name("Wash", WalkInCatalogProcess.single) == "Wash"
