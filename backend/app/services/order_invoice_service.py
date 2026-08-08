"""Build partner invoice JSON + HTML (thermal bill / A4 GST)."""

from __future__ import annotations

from html import escape
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.laundry import Laundry
from app.models.order import Order
from app.repositories.laundry import LaundryRepository
from app.schemas.order_invoice import (
    InvoicePrintVariant,
    OrderInvoiceLine,
    OrderInvoiceResponse,
)
from app.services.color_token_service import ColorTokenService
from app.services.invoice_service import InvoiceService
from app.services.order_service import OrderService
from app.services.order_tags_service import phone_last4

SWATCH_HEX = {
    "red": "#dc2626",
    "blue": "#2563eb",
    "green": "#16a34a",
    "yellow": "#ca8a04",
    "orange": "#ea580c",
    "purple": "#7c3aed",
    "pink": "#db2777",
    "teal": "#0d9488",
    "brown": "#92400e",
    "grey": "#4b5563",
}


def money(value) -> str:
    return f"{value:.2f}"


class OrderInvoiceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderService(session)
        self._laundries = LaundryRepository(session)
        self._tokens = ColorTokenService(session)
        self._invoices = InvoiceService(session)

    async def get_invoice_for_partner(
        self,
        partner_user_id: UUID,
        order_id: UUID,
    ) -> OrderInvoiceResponse:
        order = await self._orders.get_for_partner(partner_user_id, order_id)
        # Assign token if missing so bills can show R-42 (idempotent when already set).
        await self._tokens.assign_to_order(order)
        await self._invoices.ensure_invoice_number(order)
        laundry = await self._laundries.get_by_id(order.laundry_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return self.build_response(order, laundry)

    @staticmethod
    def build_response(order: Order, laundry: Laundry) -> OrderInvoiceResponse:
        if not order.invoice_number:
            raise NotFoundError("Order has no invoice number")

        phone = order.customer_phone or ""
        lines = [
            OrderInvoiceLine(
                service_name=item.service_name,
                quantity=int(item.quantity),
                unit_price_inr=item.unit_price_inr,
                line_total_inr=item.line_total_inr,
            )
            for item in (order.items or [])
        ]
        return OrderInvoiceResponse(
            order_id=order.id,
            laundry_id=order.laundry_id,
            laundry_name=laundry.name,
            laundry_address=laundry.address_line,
            laundry_city=laundry.city,
            laundry_gstin=None,  # GSTIN not on laundry model yet — omit when absent
            invoice_number=order.invoice_number,
            color_token=order.color_token,
            token_code=order.token_code,
            token_day_number=order.token_day_number,
            token_assigned_on=order.token_assigned_on,
            customer_name=order.customer_name or "Walk-in customer",
            customer_phone=phone,
            customer_phone_last4=phone_last4(phone),
            tracking_code=order.tracking_code,
            created_at=order.created_at,
            currency=order.currency or "INR",
            subtotal_inr=order.subtotal_inr,
            delivery_fee_inr=order.delivery_fee_inr,
            gst_rate=order.gst_rate,
            cgst_inr=order.cgst_inr,
            sgst_inr=order.sgst_inr,
            total_inr=order.total_inr,
            payment_status=order.payment_status.value if order.payment_status else "pending",
            lines=lines,
        )

    @staticmethod
    def render_print_html(
        payload: OrderInvoiceResponse,
        *,
        variant: InvoicePrintVariant = InvoicePrintVariant.bill,
    ) -> str:
        if variant == InvoicePrintVariant.gst:
            return OrderInvoiceService._render_gst_html(payload)
        return OrderInvoiceService._render_bill_html(payload)

    @staticmethod
    def _swatch(payload: OrderInvoiceResponse) -> str:
        if payload.color_token is None:
            return "#111827"
        return SWATCH_HEX.get(payload.color_token.value, "#111827")

    @staticmethod
    def _line_rows_html(payload: OrderInvoiceResponse) -> str:
        rows: list[str] = []
        for line in payload.lines:
            rows.append(
                f"""
<tr>
  <td>{escape(line.service_name)}</td>
  <td class="num">{line.quantity}</td>
  <td class="num">{money(line.unit_price_inr)}</td>
  <td class="num">{money(line.line_total_inr)}</td>
</tr>
""",
            )
        return "".join(rows) or "<tr><td colspan='4'>No items</td></tr>"

    @staticmethod
    def _totals_block(payload: OrderInvoiceResponse, *, huge: bool = False) -> str:
        total_cls = "total huge" if huge else "total"
        delivery = ""
        if payload.delivery_fee_inr and payload.delivery_fee_inr > 0:
            delivery = (
                f"<div class='row'><span>Delivery</span>"
                f"<span>₹{money(payload.delivery_fee_inr)}</span></div>"
            )
        return f"""
<div class="totals">
  <div class="row"><span>Subtotal</span><span>₹{money(payload.subtotal_inr)}</span></div>
  {delivery}
  <div class="row"><span>CGST ({money(payload.gst_rate / 2)}%)</span><span>₹{money(payload.cgst_inr)}</span></div>
  <div class="row"><span>SGST ({money(payload.gst_rate / 2)}%)</span><span>₹{money(payload.sgst_inr)}</span></div>
  <div class="{total_cls}"><span>TOTAL</span><span>₹{money(payload.total_inr)}</span></div>
</div>
"""

    @staticmethod
    def _token_chip_html(payload: OrderInvoiceResponse) -> str:
        if not payload.token_code:
            return ""
        swatch = OrderInvoiceService._swatch(payload)
        return (
            f'<div class="token" style="border-color:{swatch}">'
            f'<span class="swatch" style="background:{swatch}"></span>'
            f"<strong>{escape(payload.token_code)}</strong></div>"
        )

    @staticmethod
    def _render_bill_html(payload: OrderInvoiceResponse) -> str:
        """Thermal ~58mm counter bill."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Bill {escape(payload.invoice_number)}</title>
<style>
  @page {{ size: 58mm auto; margin: 2mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: system-ui, sans-serif;
    color: #111;
    background: #fff;
  }}
  .bill {{
    width: 54mm;
    padding: 3mm;
  }}
  h1 {{ margin: 0 0 2mm; font-size: 14px; text-align: center; }}
  .meta, .shop {{ margin: 0.5mm 0; font-size: 10px; text-align: center; }}
  .token {{
    display: flex; align-items: center; justify-content: center; gap: 2mm;
    margin: 2mm 0; padding: 1.5mm; border: 1.5px solid #111; border-radius: 2mm;
    font-size: 18px; font-weight: 800;
  }}
  .swatch {{ width: 4mm; height: 4mm; border-radius: 1mm; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 10px; margin: 2mm 0; }}
  th, td {{ text-align: left; padding: 1mm 0; vertical-align: top; }}
  th {{ border-bottom: 1px solid #ccc; font-size: 9px; text-transform: uppercase; }}
  .num {{ text-align: right; white-space: nowrap; }}
  .totals .row {{ display: flex; justify-content: space-between; font-size: 10px; margin: 0.5mm 0; }}
  .totals .total {{
    display: flex; justify-content: space-between; margin-top: 2mm;
    padding-top: 2mm; border-top: 2px solid #111; font-weight: 800;
  }}
  .totals .huge {{ font-size: 20px; line-height: 1.1; }}
  .inv {{ margin-top: 2mm; font-size: 10px; font-family: ui-monospace, monospace; text-align: center; }}
  @media print {{ .no-print {{ display: none !important; }} }}
</style>
</head>
<body>
<button class="no-print" onclick="window.print()" style="margin:8px;padding:8px 12px;font-size:14px">Print</button>
<section class="bill" data-print-variant="bill">
  <h1>{escape(payload.laundry_name)}</h1>
  <p class="shop">{escape(payload.laundry_address or "")}</p>
  <p class="meta">{escape(payload.customer_name)} · …{escape(payload.customer_phone_last4)}</p>
  {OrderInvoiceService._token_chip_html(payload)}
  <table>
    <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amt</th></tr></thead>
    <tbody>{OrderInvoiceService._line_rows_html(payload)}</tbody>
  </table>
  {OrderInvoiceService._totals_block(payload, huge=True)}
  <p class="inv">Inv {escape(payload.invoice_number)}</p>
  <p class="meta">#{escape(payload.tracking_code)}</p>
</section>
</body>
</html>
"""

    @staticmethod
    def _render_gst_html(payload: OrderInvoiceResponse) -> str:
        """A4 formal GST invoice (HTML print)."""
        gstin_line = (
            f"<p>GSTIN: {escape(payload.laundry_gstin)}</p>"
            if payload.laundry_gstin
            else "<p>GSTIN: — (update in Advanced settings when available)</p>"
        )
        half = money(payload.gst_rate / 2) if payload.gst_rate is not None else "0.00"
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>GST Invoice {escape(payload.invoice_number)}</title>
<style>
  @page {{ size: A4; margin: 14mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #111;
    background: #fff;
  }}
  .invoice {{
    max-width: 190mm;
    margin: 0 auto;
    padding: 8mm;
  }}
  header {{
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 2px solid #111;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }}
  h1 {{ margin: 0; font-size: 22px; }}
  h2 {{ margin: 0; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; }}
  .muted {{ color: #444; font-size: 12px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }}
  .token {{
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 10px; border: 2px solid #111; border-radius: 8px;
    font-size: 20px; font-weight: 800;
  }}
  .swatch {{ width: 14px; height: 14px; border-radius: 3px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }}
  th, td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
  th {{ background: #f5f5f5; font-size: 11px; text-transform: uppercase; }}
  .num {{ text-align: right; white-space: nowrap; }}
  .totals {{ margin-left: auto; width: 280px; }}
  .totals .row {{ display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }}
  .totals .total.huge {{
    display: flex; justify-content: space-between; margin-top: 8px;
    padding-top: 8px; border-top: 2px solid #111; font-size: 28px; font-weight: 800;
  }}
  footer {{ margin-top: 24px; font-size: 11px; color: #555; }}
  @media print {{ .no-print {{ display: none !important; }} }}
</style>
</head>
<body>
<button class="no-print" onclick="window.print()" style="margin:8px;padding:8px 12px;font-size:14px">Print</button>
<article class="invoice" data-print-variant="gst">
  <header>
    <div>
      <h1>{escape(payload.laundry_name)}</h1>
      <p class="muted">{escape(payload.laundry_address or "")}</p>
      <p class="muted">{escape(payload.laundry_city or "")}</p>
      {gstin_line}
    </div>
    <div style="text-align:right">
      <h2>Tax Invoice</h2>
      <p><strong>{escape(payload.invoice_number)}</strong></p>
      <p class="muted">#{escape(payload.tracking_code)}</p>
      {OrderInvoiceService._token_chip_html(payload)}
    </div>
  </header>
  <div class="grid">
    <div>
      <p class="muted">Bill to</p>
      <p><strong>{escape(payload.customer_name)}</strong></p>
      <p>{escape(payload.customer_phone or "—")}</p>
    </div>
    <div>
      <p class="muted">GST summary</p>
      <p>Rate: {money(payload.gst_rate)}% (CGST {half}% + SGST {half}%)</p>
      <p>Payment: {escape(payload.payment_status)}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Rate (₹)</th>
        <th class="num">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      {"".join(
            f"<tr><td>{idx}</td><td>{escape(line.service_name)}</td>"
            f"<td class='num'>{line.quantity}</td>"
            f"<td class='num'>{money(line.unit_price_inr)}</td>"
            f"<td class='num'>{money(line.line_total_inr)}</td></tr>"
            for idx, line in enumerate(payload.lines, start=1)
        ) or "<tr><td colspan='5'>No items</td></tr>"}
    </tbody>
  </table>
  {OrderInvoiceService._totals_block(payload, huge=True)}
  <footer>
    Amounts are frozen at order create. Reprint does not recalculate GST.
    CGST ₹{money(payload.cgst_inr)} · SGST ₹{money(payload.sgst_inr)} · Total ₹{money(payload.total_inr)}
  </footer>
</article>
</body>
</html>
"""
