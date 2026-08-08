"""Partner invoice JSON + HTML print API tests."""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from tests.api.test_order_color_tokens import _partner_headers, _seed_partner_laundry

pytestmark = pytest.mark.asyncio


@patch("app.tasks.order_notifications.send_order_status_whatsapp")
async def test_order_invoice_json_and_print_html_idempotent(
    mock_whatsapp_task: MagicMock,
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    mock_whatsapp_task.delay = MagicMock()
    _partner, _laundry, service, token = await _seed_partner_laundry(db_session)

    create = await client.post(
        "/api/v1/partner/walk-in-orders",
        headers=_partner_headers(token),
        json={
            "customer_name": "Priya Sharma",
            "customer_phone": "+919876543210",
            "items": [{"service_id": str(service.id), "quantity": 2}],
        },
    )
    assert create.status_code == 201
    created = create.json()["data"]
    order_id = created["id"]
    token_code = created["token_code"]
    subtotal = created["subtotal_inr"]
    cgst = created["cgst_inr"]
    sgst = created["sgst_inr"]
    total = created["total_inr"]

    first = await client.get(
        f"/api/v1/partner/orders/{order_id}/invoice",
        headers=_partner_headers(token),
    )
    assert first.status_code == 200
    data = first.json()["data"]
    assert data["token_code"] == token_code
    assert data["invoice_number"].startswith("WH-")
    assert data["gst_rate"] in ("18", "18.00", 18, 18.0) or str(data["gst_rate"]).startswith("18")
    assert Decimal(str(data["subtotal_inr"])) == Decimal(str(subtotal))
    assert Decimal(str(data["cgst_inr"])) == Decimal(str(cgst))
    assert Decimal(str(data["sgst_inr"])) == Decimal(str(sgst))
    assert Decimal(str(data["total_inr"])) == Decimal(str(total))
    assert len(data["lines"]) == 1
    assert data["lines"][0]["quantity"] == 2
    invoice_number = data["invoice_number"]

    # Reprint — same invoice number + same frozen totals
    second = await client.get(
        f"/api/v1/partner/orders/{order_id}/invoice",
        headers=_partner_headers(token),
    )
    assert second.status_code == 200
    again = second.json()["data"]
    assert again["invoice_number"] == invoice_number
    assert Decimal(str(again["total_inr"])) == Decimal(str(total))
    assert Decimal(str(again["cgst_inr"])) == Decimal(str(cgst))

    order = (
        await db_session.execute(select(Order).where(Order.id == UUID(order_id)))
    ).scalar_one()
    assert order.invoice_number == invoice_number
    assert order.total_inr == Decimal(str(total))

    bill_html = await client.get(
        f"/api/v1/partner/orders/{order_id}/invoice/print",
        headers=_partner_headers(token),
        params={"variant": "bill"},
    )
    assert bill_html.status_code == 200
    assert "text/html" in bill_html.headers["content-type"]
    assert invoice_number in bill_html.text
    assert token_code in bill_html.text
    assert "58mm" in bill_html.text or "54mm" in bill_html.text
    assert f"₹{Decimal(str(total)):.2f}" in bill_html.text

    gst_html = await client.get(
        f"/api/v1/partner/orders/{order_id}/invoice/print",
        headers=_partner_headers(token),
        params={"variant": "gst"},
    )
    assert gst_html.status_code == 200
    assert "A4" in gst_html.text
    assert "Tax Invoice" in gst_html.text
    assert invoice_number in gst_html.text
    assert f"₹{Decimal(str(cgst)):.2f}" in gst_html.text or str(cgst) in gst_html.text
