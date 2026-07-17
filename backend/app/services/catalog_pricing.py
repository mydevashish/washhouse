"""Shared catalog price-shape helpers (partner + public price lists)."""

from __future__ import annotations

from app.models.catalog import PlatformCatalogItem


def catalog_price_mode(item: PlatformCatalogItem) -> str:
    """Classify catalog money shape for validation + UI."""
    if item.suggested_price_inr is not None:
        return "single"
    if item.suggested_dry_clean_inr is not None or item.suggested_press_inr is not None:
        return "dual"
    return "deferred"


def catalog_allows_press(item: PlatformCatalogItem) -> bool:
    """Press column is only valid when the catalog item publishes a press suggested rate."""
    return item.suggested_press_inr is not None
