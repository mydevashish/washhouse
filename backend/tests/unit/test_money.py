"""Unit tests for money helpers used by partner price-list."""

from __future__ import annotations

from decimal import Decimal

from app.utils.money import format_inr, inr_to_paise


def test_format_inr_and_paise() -> None:
    assert format_inr(None) is None
    assert format_inr(Decimal("69")) == "69.00"
    assert format_inr(Decimal("69.5")) == "69.50"
    assert inr_to_paise(None) is None
    assert inr_to_paise(Decimal("69.00")) == 6900
    assert inr_to_paise(Decimal("0.01")) == 1
    # Half-even at paise boundary
    assert inr_to_paise(Decimal("1.005")) == 100
