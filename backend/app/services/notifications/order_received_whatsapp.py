"""Rich WhatsApp body for walk-in order received (create + retry)."""

from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from zoneinfo import ZoneInfo

from app.models.enums import OrderSource, OrderStatus, PaymentStatus
from app.services.notifications.order_status_whatsapp_notifier import STATUS_LABELS
from app.services.notifications.whatsapp import _template_content_sid
from app.utils.money import format_inr

if TYPE_CHECKING:
    from app.models.order import Order, OrderItem

IST = ZoneInfo("Asia/Kolkata")
_E164_RE = re.compile(r"^\+[1-9]\d{9,14}$")


def is_valid_e164_phone(phone: str | None) -> bool:
    if not phone or not phone.strip():
        return False
    return bool(_E164_RE.match(phone.strip()))


def format_items_summary(items: list[OrderItem]) -> str:
    counts: dict[str, int] = {}
    for item in items:
        label = (item.service_name or "Item").strip() or "Item"
        qty = max(1, int(item.quantity))
        counts[label] = counts.get(label, 0) + qty
    parts = [f"1 {name}" if qty == 1 else f"{qty} × {name}" for name, qty in counts.items()]
    return ", ".join(parts) if parts else "Items as discussed"


def format_ready_window(delivery_at: datetime | None) -> str:
    if delivery_at is None:
        return "We will confirm ready time at the shop"
    aware = delivery_at if delivery_at.tzinfo else delivery_at.replace(tzinfo=IST)
    local = aware.astimezone(IST)
    return local.strftime("%a %d %b, %I:%M %p IST").replace(" 0", " ")


def format_bag_token(order: Order) -> str:
    if order.token_code:
        color = getattr(order.color_token, "value", order.color_token) or ""
        color_bit = f" ({color})" if color else ""
        return f"{order.token_code}{color_bit}"
    return "—"


def format_payment_summary(total_inr: Decimal, payment_status: PaymentStatus) -> str:
    total = format_inr(total_inr) or "0.00"
    if payment_status == PaymentStatus.paid:
        return f"Total paid: ₹{total}"
    return f"Total: ₹{total} — balance due at pickup/collection"


def build_order_received_variables(order: Order, *, laundry_name: str) -> dict[str, str]:
    status_label = STATUS_LABELS.get(OrderStatus.confirmed, "received")
    return {
        "customer_name": (order.customer_name or "Customer").strip(),
        "tracking_code": order.tracking_code,
        "laundry_name": laundry_name,
        "status_label": status_label,
        "items_summary": format_items_summary(list(order.items)),
        "bag_token": format_bag_token(order),
        "ready_window": format_ready_window(order.delivery_at),
        "payment_summary": format_payment_summary(order.total_inr, order.payment_status),
    }


def render_order_received_detailed_plain(variables: dict[str, str]) -> str:
    return (
        f"Hi {variables['customer_name']}! We've received your laundry order "
        f"{variables['tracking_code']} at {variables['laundry_name']}.\n"
        f"Items: {variables['items_summary']}\n"
        f"Bag token: {variables['bag_token']}\n"
        f"Ready by: {variables['ready_window']}\n"
        f"{variables['payment_summary']}\n"
        f"Status: {variables['status_label']}. We'll notify you as it progresses. "
        f"Thank you for choosing DLM."
    )


def resolve_order_received_template() -> str:
    if _template_content_sid("order_received_detailed"):
        return "order_received_detailed"
    if _template_content_sid("order_received"):
        return "order_received"
    return "order_received_detailed"


def order_received_template_variables(order: Order, *, laundry_name: str) -> tuple[str, dict[str, str]]:
    rich = build_order_received_variables(order, laundry_name=laundry_name)
    template = resolve_order_received_template()
    if template == "order_received":
        return template, {
            "customer_name": rich["customer_name"],
            "tracking_code": rich["tracking_code"],
            "laundry_name": rich["laundry_name"],
            "status_label": rich["status_label"],
        }
    return template, rich


def whatsapp_order_received_meta(order: Order, *, laundry_name: str) -> dict[str, str | bool | None]:
    phone_ok = is_valid_e164_phone(order.customer_phone)
    eligible = (
        order.order_source == OrderSource.walk_in
        and phone_ok
        and order.status == OrderStatus.confirmed
    )
    if not eligible:
        if order.order_source != OrderSource.walk_in:
            status = "skipped_not_walk_in"
        elif not phone_ok:
            status = "skipped_invalid_phone"
        else:
            status = "skipped_not_confirmed"
        return {"eligible": False, "status": status, "message_body": None}

    body = render_order_received_detailed_plain(
        build_order_received_variables(order, laundry_name=laundry_name),
    )
    return {"eligible": True, "status": "scheduled", "message_body": body}