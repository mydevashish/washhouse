"""Per-order paid / pending amounts for partner order list + detail."""

from __future__ import annotations

import json
import re
from decimal import Decimal

from app.models.enums import OrderSource, OrderStatus, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.services.partner_money_math import money_str

_MONEY = Decimal("0.01")
_ZERO = Decimal("0")


def order_ticket_total_inr(order: Order) -> Decimal:
    """Counter ticket (no GST) for walk-in; GST-inclusive total for online orders."""
    stored = Decimal(str(order.total_inr)).quantize(_MONEY)
    if getattr(order, "order_source", None) != OrderSource.walk_in:
        return stored
    gst = Decimal(str(getattr(order, "cgst_inr", 0) or 0)) + Decimal(
        str(getattr(order, "sgst_inr", 0) or 0),
    )
    items = list(getattr(order, "items", None) or [])
    from_lines = _ZERO
    for item in items:
        from_lines += _line_ticket_amount(item)
    discount = Decimal(str(getattr(order, "discount_inr", 0) or 0))
    delivery = Decimal(str(getattr(order, "delivery_fee_inr", 0) or 0))
    if from_lines > _ZERO:
        return max(_ZERO, (from_lines - discount + delivery).quantize(_MONEY))
    if gst > _ZERO:
        subtotal = Decimal(str(getattr(order, "subtotal_inr", stored) or stored))
        return max(_ZERO, (subtotal - discount + delivery).quantize(_MONEY))
    return stored


def _line_ticket_amount(item: object) -> Decimal:
    line = Decimal(str(getattr(item, "line_total_inr", 0) or 0)).quantize(_MONEY)
    quantity = int(getattr(item, "quantity", 0) or 0)
    garments = [
        g
        for g in list(getattr(item, "garments", None) or [])
        if int(getattr(g, "quantity", 0) or 0) > 0
    ]
    piece_sum = sum(int(g.quantity) for g in garments)
    unit_raw = getattr(item, "unit_price_inr", None)
    if garments and quantity == piece_sum and quantity > 1:
        if unit_raw is not None:
            return Decimal(str(unit_raw)).quantize(_MONEY)
        return (line / quantity).quantize(_MONEY)
    return line


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


_ADVANCE_NOTE_RE = re.compile(
    r"(?:Advance paid|Advance)\s*:?\s*(?:₹|Rs\.?\s*)?(\d+(?:\.\d{1,2})?)",
    re.IGNORECASE,
)


def _parse_advance_from_notes(*blobs: str | None) -> Decimal:
    for blob in blobs:
        if not blob:
            continue
        match = _ADVANCE_NOTE_RE.search(blob)
        if not match:
            continue
        try:
            value = Decimal(match.group(1)).quantize(_MONEY)
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
    total = order_ticket_total_inr(order)
    paid = _ZERO
    notes_advance = _parse_advance_from_notes(
        getattr(order, "partner_notes", None),
        getattr(order, "notes", None),
    )

    if payment is not None and payment.status == PaymentStatus.paid:
        paid = Decimal(str(payment.amount_inr)).quantize(_MONEY)
    elif order.payment_status == PaymentStatus.paid:
        if payment is not None:
            paid = Decimal(str(payment.amount_inr)).quantize(_MONEY)
        else:
            paid = total
    elif payment is not None:
        paid = _parse_advance_from_metadata(payment.metadata_json)
        if paid <= _ZERO:
            paid = notes_advance
        if paid <= _ZERO:
            amount = Decimal(str(payment.amount_inr)).quantize(_MONEY)
            # Partial COD advance stored as pending_cod (not the full unpaid ticket).
            if _ZERO < amount < total:
                paid = amount
    else:
        paid = notes_advance

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
        "ticket_total_inr": money_str(total),
    }
