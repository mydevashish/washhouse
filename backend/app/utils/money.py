"""INR ↔ paise helpers for catalog / partner price-list APIs."""

from __future__ import annotations

from decimal import ROUND_HALF_EVEN, Decimal


def format_inr(value: Decimal | None) -> str | None:
    if value is None:
        return None
    quantized = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    return f"{quantized:.2f}"


def inr_to_paise(value: Decimal | None) -> int | None:
    """Convert INR NUMERIC to integer paise (half-even at the paise boundary)."""
    if value is None:
        return None
    paise = (value * Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)
    return int(paise)
