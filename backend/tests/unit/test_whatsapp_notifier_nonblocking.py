"""Unit: WhatsApp status notifier must not block the request thread (BUG-020)."""

from __future__ import annotations

import time
from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.models.enums import OrderSource, OrderStatus
from app.models.order import Order
from app.services.notifications.order_status_whatsapp_notifier import (
    OrderStatusWhatsAppNotifier,
)


def _walk_in_order() -> Order:
    return Order(
        id=uuid4(),
        user_id=None,
        laundry_id=uuid4(),
        order_source=OrderSource.walk_in,
        status=OrderStatus.confirmed,
        tracking_code=f"DLM{uuid4().hex[:8].upper()}",
        customer_name="Priya",
        customer_phone="+919876543210",
        subtotal_inr=Decimal("100.00"),
        delivery_fee_inr=Decimal("0.00"),
        cgst_inr=Decimal("0.00"),
        sgst_inr=Decimal("0.00"),
        total_inr=Decimal("100.00"),
    )


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
def test_schedule_returns_immediately_when_delay_blocks(mock_task: MagicMock) -> None:
    def _slow(*_a: object, **_k: object) -> None:
        time.sleep(20)

    mock_task.delay = _slow
    order = _walk_in_order()

    started = time.perf_counter()
    OrderStatusWhatsAppNotifier.schedule(order, OrderStatus.confirmed)
    elapsed = time.perf_counter() - started

    assert elapsed < 1.0, f"schedule blocked for {elapsed:.2f}s"


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
def test_schedule_skips_non_walk_in(mock_task: MagicMock) -> None:
    mock_task.delay = MagicMock()
    order = _walk_in_order()
    order.order_source = OrderSource.online
    OrderStatusWhatsAppNotifier.schedule(order, OrderStatus.confirmed)
    time.sleep(0.1)
    mock_task.delay.assert_not_called()
