"""Settlement amount helpers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.models.enums import PaymentStatus
from app.models.order import Order


def calc_order_settlement_amounts(order: Order) -> dict[str, Decimal]:
    gross = Decimal(str(order.total_inr))
    commission = (gross * Decimal(str(order.commission_rate)) / Decimal("100")).quantize(Decimal("0.01"))
    refund = gross if order.payment_status == PaymentStatus.refunded else Decimal("0")
    net = (gross - commission - refund).quantize(Decimal("0.01"))
    return {
        "gross_inr": gross,
        "commission_inr": commission,
        "refund_inr": refund,
        "net_inr": net,
    }


def dispute_window_end(delivered_at: datetime, *, hours: int = 48) -> datetime:
    return delivered_at + timedelta(hours=hours)


def utc_now() -> datetime:
    return datetime.now(UTC)
