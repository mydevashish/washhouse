from datetime import UTC, datetime
from decimal import Decimal

from app.models.enums import OrderSource, OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.services.order_payment_snapshot import compute_order_payment_snapshot

_NOW = datetime.now(UTC)


def test_compute_order_payment_snapshot_partial_cod_advance() -> None:
    order = Order(
        order_source=OrderSource.walk_in,
        status=OrderStatus.confirmed,
        tracking_code="WH-001",
        pickup_at=_NOW,
        delivery_at=_NOW,
        subtotal_inr=Decimal("400.00"),
        total_inr=Decimal("500.00"),
        payment_status=PaymentStatus.pending_cod,
        payment_method=PaymentMethod.cod,
    )
    payment = Payment(
        order_id=order.id,
        amount_inr=Decimal("200.00"),
        status=PaymentStatus.paid,
        method=PaymentMethod.cod,
    )
    snapshot = compute_order_payment_snapshot(order, payment)
    assert snapshot["paid_inr"] == "200.00"
    assert snapshot["pending_inr"] == "300.00"


def test_compute_order_payment_snapshot_fully_paid_without_payment_row() -> None:
    order = Order(
        order_source=OrderSource.online,
        status=OrderStatus.confirmed,
        tracking_code="WH-002",
        pickup_at=_NOW,
        delivery_at=_NOW,
        subtotal_inr=Decimal("200.00"),
        total_inr=Decimal("293.82"),
        payment_status=PaymentStatus.paid,
        payment_method=PaymentMethod.razorpay,
    )
    snapshot = compute_order_payment_snapshot(order, None)
    assert snapshot["paid_inr"] == "293.82"
    assert snapshot["pending_inr"] == "0.00"
