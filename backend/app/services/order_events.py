"""Redis pub/sub notifications for live order tracking."""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

import structlog

from app.core.config import settings
from app.core.redis_client import get_redis
from app.models.enums import OrderStatus
from app.models.order import Order, OrderStatusEvent

log = structlog.get_logger(__name__)

ORDER_EVENT_CHANNEL_PREFIX = "order"


def order_events_channel(order_id: UUID) -> str:
    return f"{ORDER_EVENT_CHANNEL_PREFIX}:{order_id}:events"


def _event_payload(event: OrderStatusEvent) -> dict[str, Any]:
    return {
        "id": str(event.id),
        "status": event.status.value
        if isinstance(event.status, OrderStatus)
        else str(event.status),
        "note": event.note,
        "created_at": event.created_at.isoformat(),
    }


async def publish_order_status_update(order: Order, event: OrderStatusEvent) -> None:
    """Broadcast a status change to WebSocket subscribers (Redis pub/sub)."""
    if not settings.ORDER_WS_ENABLED:
        return

    status = order.status.value if isinstance(order.status, OrderStatus) else str(order.status)
    message = {
        "type": "status_update",
        "order_id": str(order.id),
        "status": status,
        "event": _event_payload(event),
    }
    channel = order_events_channel(order.id)
    try:
        redis = get_redis()
        await redis.publish(channel, json.dumps(message))
        log.debug("order_ws.published", order_id=str(order.id), status=status)
    except Exception as exc:
        log.warning("order_ws.publish_failed", order_id=str(order.id), error=str(exc))
