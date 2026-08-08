"""Pure helpers for partner money intelligence (growth + formatting)."""

from __future__ import annotations

from decimal import Decimal

_MONEY = Decimal("0.01")
_PCT = Decimal("0.01")
_ZERO = Decimal("0")


def money_str(value: Decimal | int | float | str) -> str:
    return str(Decimal(str(value)).quantize(_MONEY))


def growth_pct(current: Decimal, prior: Decimal) -> Decimal | None:
    """Percent change. None when prior is zero (avoid fake 1000% / div-by-zero)."""
    current = Decimal(str(current))
    prior = Decimal(str(prior))
    if prior == _ZERO:
        return None
    return ((current - prior) / prior * Decimal("100")).quantize(_PCT)


def growth_pct_str(current: Decimal, prior: Decimal) -> str | None:
    pct = growth_pct(current, prior)
    return None if pct is None else str(pct)


def partner_net(gross: Decimal, commission: Decimal) -> Decimal:
    return (Decimal(str(gross)) - Decimal(str(commission))).quantize(_MONEY)


def empty_money_fields() -> dict[str, str | None]:
    """Zero / null money intelligence fields for empty analytics payloads."""
    zero = money_str(_ZERO)
    return {
        "revenue_yesterday_inr": zero,
        "revenue_prev_week_inr": zero,
        "revenue_prev_month_inr": zero,
        "growth_today_pct": None,
        "growth_week_pct": None,
        "growth_month_pct": None,
        "effective_commission_rate": "10.00",
        "commission_today_inr": zero,
        "commission_week_inr": zero,
        "commission_month_inr": zero,
        "partner_net_today_inr": zero,
        "partner_net_week_inr": zero,
        "partner_net_month_inr": zero,
        "revenue_walk_in_today_inr": zero,
        "revenue_doorstep_today_inr": zero,
        "revenue_walk_in_week_inr": zero,
        "revenue_doorstep_week_inr": zero,
        "revenue_walk_in_month_inr": zero,
        "revenue_doorstep_month_inr": zero,
    }
