"""Unit tests for invoice helpers + GST display HTML (no DB)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from app.models.enums import ColorToken, OrderSource, OrderStatus, PaymentStatus
from app.models.laundry import Laundry
from app.models.order import Order, OrderItem
from app.services.invoice_service import format_invoice_number
from app.services.order_invoice_service import OrderInvoiceService, money
from app.schemas.order_invoice import InvoicePrintVariant


def _sample_order(*, invoice_number: str | None = "WH-2026-DLMTEST01") -> Order:
    order = Order(
        id=uuid4(),
        laundry_id=uuid4(),
        order_source=OrderSource.walk_in,
        customer_name="Priya",
        customer_phone="+919876543210",
        status=OrderStatus.confirmed,
        tracking_code="DLMTEST01",
        color_token=ColorToken.red,
        token_code="R-42",
        token_day_number=42,
        token_assigned_on=date(2026, 8, 8),
        pickup_at=datetime.now(UTC),
        delivery_at=datetime.now(UTC),
        subtotal_inr=Decimal("200.00"),
        delivery_fee_inr=Decimal("0.00"),
        gst_rate=Decimal("18.00"),
        cgst_inr=Decimal("18.00"),
        sgst_inr=Decimal("18.00"),
        total_inr=Decimal("236.00"),
        invoice_number=invoice_number,
        payment_status=PaymentStatus.pending,
        currency="INR",
    )
    order.created_at = datetime(2026, 8, 8, 10, 0, tzinfo=UTC)
    order.items = [
        OrderItem(
            service_id=uuid4(),
            service_name="Shirt / T-shirt · Dry clean",
            quantity=2,
            unit_price_inr=Decimal("100.00"),
            line_total_inr=Decimal("200.00"),
        ),
    ]
    return order


def _sample_laundry(laundry_id) -> Laundry:
    return Laundry(
        id=laundry_id,
        owner_user_id=uuid4(),
        name="Demo Laundry",
        slug="demo-laundry",
        city="Bengaluru",
        address_line="12 MG Road, Bengaluru 560001",
    )


def test_format_invoice_number() -> None:
    assert format_invoice_number(year=2026, tracking_code="DLMTEST01") == "WH-2026-DLMTEST01"


def test_gst_math_display_on_bill_and_invoice() -> None:
    order = _sample_order()
    laundry = _sample_laundry(order.laundry_id)
    payload = OrderInvoiceService.build_response(order, laundry)

    assert payload.invoice_number == "WH-2026-DLMTEST01"
    assert payload.gst_rate == Decimal("18.00")
    assert payload.cgst_inr == Decimal("18.00")
    assert payload.sgst_inr == Decimal("18.00")
    assert payload.total_inr == Decimal("236.00")
    assert payload.cgst_inr + payload.sgst_inr + payload.subtotal_inr == payload.total_inr
    assert payload.lines[0].unit_price_inr == Decimal("100.00")
    assert payload.token_code == "R-42"

    bill = OrderInvoiceService.render_print_html(payload, variant=InvoicePrintVariant.bill)
    assert "58mm" in bill
    assert "R-42" in bill
    assert "WH-2026-DLMTEST01" in bill
    assert "CGST (9.00%)" in bill
    assert "SGST (9.00%)" in bill
    assert "₹18.00" in bill
    assert "₹236.00" in bill
    assert "Shirt / T-shirt" in bill
    assert 'data-print-variant="bill"' in bill

    gst = OrderInvoiceService.render_print_html(payload, variant=InvoicePrintVariant.gst)
    assert "A4" in gst
    assert "Tax Invoice" in gst
    assert "WH-2026-DLMTEST01" in gst
    assert "₹236.00" in gst
    assert "CGST ₹18.00" in gst
    assert "SGST ₹18.00" in gst
    assert 'data-print-variant="gst"' in gst
    assert "does not recalculate GST" in gst


def test_reprint_uses_frozen_totals_snapshot() -> None:
    """Reprint must echo persisted amounts — never recompute from line math."""
    order = _sample_order()
    # Intentionally inconsistent line math vs totals (simulates frozen historical invoice).
    order.items[0].line_total_inr = Decimal("999.00")
    order.subtotal_inr = Decimal("200.00")
    order.total_inr = Decimal("236.00")
    laundry = _sample_laundry(order.laundry_id)
    payload = OrderInvoiceService.build_response(order, laundry)
    assert payload.subtotal_inr == Decimal("200.00")
    assert payload.total_inr == Decimal("236.00")
    html = OrderInvoiceService.render_print_html(payload, variant=InvoicePrintVariant.bill)
    assert "₹236.00" in html
    assert money(Decimal("18")) == "18.00"
