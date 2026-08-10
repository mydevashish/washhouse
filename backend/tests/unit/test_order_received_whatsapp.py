"""Unit tests for walk-in order received WhatsApp formatter."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from app.models.enums import ColorToken, OrderSource, OrderStatus, PaymentStatus
from app.models.order import Order, OrderItem
from app.services.notifications.order_received_whatsapp import (
    build_order_received_variables,
    format_items_summary,
    format_payment_summary,
    is_valid_e164_phone,
    render_order_received_detailed_plain,
    resolve_order_received_template,
)


def test_is_valid_e164_phone() -> None:
    assert is_valid_e164_phone("+919876543210") is True
    assert is_valid_e164_phone("9876543210") is False
    assert is_valid_e164_phone("") is False


def test_format_items_summary_groups_quantities() -> None:
    items = [
        OrderItem(service_name="Shirt · Wash", quantity=2, unit_price_inr=Decimal("50"), line_total_inr=Decimal("100")),
        OrderItem(service_name="Pant", quantity=1, unit_price_inr=Decimal("40"), line_total_inr=Decimal("40")),
    ]
    assert format_items_summary(items) == "2 × Shirt · Wash, 1 Pant"


def test_format_payment_summary_unpaid() -> None:
    text = format_payment_summary(Decimal("118.00"), PaymentStatus.pending)
    assert "₹118.00" in text
    assert "balance due" in text


def test_render_order_received_detailed_plain() -> None:
    order = Order(
        id=uuid4(),
        laundry_id=uuid4(),
        order_source=OrderSource.walk_in,
        customer_name="Priya",
        customer_phone="+919876543210",
        status=OrderStatus.confirmed,
        tracking_code="DLM-TEST01",
        color_token=ColorToken.red,
        token_code="R-42",
        delivery_at=datetime(2026, 8, 10, 14, 30, tzinfo=UTC),
        subtotal_inr=Decimal("100"),
        total_inr=Decimal("118"),
        payment_status=PaymentStatus.pending,
    )
    order.items = [
        OrderItem(
            service_name="Shirt",
            quantity=2,
            unit_price_inr=Decimal("50"),
            line_total_inr=Decimal("100"),
        ),
    ]

    variables = build_order_received_variables(order, laundry_name="Sparkle Wash")
    body = render_order_received_detailed_plain(variables)

    assert "Priya" in body
    assert "DLM-TEST01" in body
    assert "Sparkle Wash" in body
    assert "2 × Shirt" in body
    assert "R-42" in body
    assert "balance due" in body


def test_resolve_order_received_template_sandbox_default() -> None:
    assert resolve_order_received_template() == "order_received_detailed"
