"""Walk-in order status updates via WhatsApp."""

from __future__ import annotations

import threading

import structlog

from app.models.enums import OrderSource, OrderStatus
from app.models.order import Order

log = structlog.get_logger(__name__)

NOTIFY_STATUSES = frozenset(
    {
        OrderStatus.confirmed,
        OrderStatus.washing,
        OrderStatus.ready,
        OrderStatus.delivered,
    },
)

STATUS_LABELS: dict[OrderStatus, str] = {
    OrderStatus.confirmed: "received",
    OrderStatus.washing: "being washed",
    OrderStatus.ready: "ready for pickup",
    OrderStatus.delivered: "delivered",
}

STATUS_TEMPLATES: dict[OrderStatus, str] = {
    OrderStatus.confirmed: "order_received",
    OrderStatus.washing: "order_in_progress",
    OrderStatus.ready: "order_ready_for_pickup",
    OrderStatus.delivered: "order_delivered",
}


def template_for_status(status: OrderStatus) -> str | None:
    return STATUS_TEMPLATES.get(status)


class OrderStatusWhatsAppNotifier:
    """Enqueue WhatsApp notifications for walk-in customers on status changes."""

    @classmethod
    def schedule(cls, order: Order, status: OrderStatus) -> None:
        """Enqueue WhatsApp notify without blocking the request path.

        Celery broker connect can hang for minutes when Redis is down; enqueue
        on a daemon thread so walk-in create / status PATCH stays responsive.
        """
        if order.order_source != OrderSource.walk_in:
            return
        if not order.customer_phone:
            return
        if status not in NOTIFY_STATUSES:
            return

        order_id = str(order.id)
        status_value = status.value

        def _enqueue() -> None:
            try:
                from app.tasks.order_notifications import send_order_status_whatsapp

                send_order_status_whatsapp.delay(order_id, status_value)
                log.info(
                    "order.whatsapp_notify_scheduled",
                    order_id=order_id,
                    status=status_value,
                )
            except Exception as exc:
                log.warning(
                    "order.whatsapp_notify_enqueue_failed",
                    order_id=order_id,
                    status=status_value,
                    error=str(exc),
                )

        threading.Thread(target=_enqueue, name="whatsapp-notify-enqueue", daemon=True).start()
