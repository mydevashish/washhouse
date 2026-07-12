"""Celery tasks for order-related outbound notifications."""

from __future__ import annotations

import asyncio
from uuid import UUID

import structlog

from app.models.enums import OrderSource, OrderStatus
from app.tasks.celery_app import celery_app

log = structlog.get_logger(__name__)


async def _send_order_status_whatsapp(order_id: UUID, status: OrderStatus) -> None:
    from app.db.session import AsyncSessionLocal
    from app.repositories.laundry import LaundryRepository
    from app.repositories.order import OrderRepository
    from app.services.notifications.dispatch import is_channel_enabled
    from app.services.notifications.order_status_whatsapp_notifier import (
        STATUS_LABELS,
        template_for_status,
    )
    from app.services.notifications.whatsapp import get_whatsapp_provider

    async with AsyncSessionLocal() as session:
        if not await is_channel_enabled(session, "sms"):
            log.info("order.whatsapp_skipped_channel_disabled", order_id=str(order_id))
            return

        order = await OrderRepository(session).get_by_id(order_id)
        if not order or order.order_source != OrderSource.walk_in or not order.customer_phone:
            return

        laundry = await LaundryRepository(session).get_by_id(order.laundry_id)
        laundry_name = laundry.name if laundry else "your laundry"

        variables = {
            "customer_name": (order.customer_name or "Customer").strip(),
            "tracking_code": order.tracking_code,
            "laundry_name": laundry_name,
            "status_label": STATUS_LABELS.get(status, status.value.replace("_", " ")),
        }

        template = template_for_status(status)
        if not template:
            return

        provider = get_whatsapp_provider()
        try:
            await provider.send_template(
                order.customer_phone,
                template,
                variables,
            )
        except Exception as exc:
            log.error(
                "order.whatsapp_send_failed",
                order_id=str(order_id),
                status=status.value,
                phone=order.customer_phone[-4:],
                error=str(exc),
            )


@celery_app.task(name="send_order_status_whatsapp")
def send_order_status_whatsapp(order_id: str, status: str) -> None:
    asyncio.run(_send_order_status_whatsapp(UUID(order_id), OrderStatus(status)))
