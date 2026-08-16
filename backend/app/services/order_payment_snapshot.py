"""Per-order paid / pending amounts for partner order list + detail."""

from __future__ import annotations

import json
from decimal import Decimal

from app.models.enums import OrderStatus, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.services.partner_money_math import money_str

_MONEY = Decimal("0.01")
_ZERO = Decimal("0")


def _parse_advance_from_metadata(metadata_json: str | None) -> Decimal:
    if not metadata_json:
        return _ZERO
    try:
        payload = json.loads(metadata_json)
    except (json.JSONDecodeError, TypeError):
        return _ZERO
    if not isinstance(payload, dict):
        return _ZERO
    for key in ("advance_inr", "advance_paid_inr", "cod_advance_inr"):
        raw = payload.get(key)
        if raw is None:
            continue
        try:
            value = Decimal(str(raw)).quantize(_MONEY)
        except Exception:
            continue
        if value > _ZERO:
            return value
    return _ZERO


def compute_order_payment_snapshot(
    order: Order,
    payment: Payment | None = None,
) -> dict[str, str]:
    """Return ``paid_inr`` and ``pending_inr`` decimal strings for an order row."""
    total = Decimal(str(order.total_inr)).quantize(_MONEY)
    paid = _ZERO

    if payment is not None and payment.status == PaymentStatus.paid:
        paid = Decimal(str(payment.amount_inr)).quantize(_MONEY)
    elif order.payment_status == PaymentStatus.paid:
        if payment is not None:
            paid = Decimal(str(payment.amount_inr)).quantize(_MONEY)
        else:
            paid = total
    elif payment is not None:
        paid = _parse_advance_from_metadata(payment.metadata_json)

    if paid > total:
        paid = total

    if order.payment_status in (PaymentStatus.refunded, PaymentStatus.failed):
        pending = _ZERO
    elif order.status == OrderStatus.cancelled:
        pending = _ZERO
    else:
        pending = max(_ZERO, total - paid)

    return {
        "paid_inr": money_str(paid),
        "pending_inr": money_str(pending),
    }
