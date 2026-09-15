import type { OrderItem } from '@/services/orders';
import type { PartnerOrder } from '@/services/partner';

function lineTicketAmount(item: OrderItem): number {
  const line = Number(item.line_total_inr ?? 0);
  const quantity = item.quantity ?? 0;
  const garments = item.garments?.filter((g) => g.quantity > 0) ?? [];
  const pieceSum = garments.reduce((sum, g) => sum + g.quantity, 0);
  if (garments.length && quantity === pieceSum && quantity > 1) {
    const unit = item.unit_price_inr != null ? Number(item.unit_price_inr) : line / quantity;
    return Number.isFinite(unit) ? unit : line;
  }
  return line;
}

/** Walk-in ticket (no GST, no piece-count × kg). Online uses stored total. */
export function partnerOrderTicketTotalInr(order: PartnerOrder): number {
  if (order.ticket_total_inr != null && order.ticket_total_inr !== '') {
    return Number(order.ticket_total_inr);
  }
  const discount = Number(order.discount_inr ?? 0);
  const delivery = Number(order.delivery_fee_inr ?? 0);
  const gst = Number(order.cgst_inr ?? 0) + Number(order.sgst_inr ?? 0);
  if (order.order_source === 'walk_in') {
    const fromLines = (order.items ?? []).reduce((sum, item) => sum + lineTicketAmount(item), 0);
    if (fromLines > 0) return Math.max(0, fromLines - discount + delivery);
    if (gst > 0) return Math.max(0, Number(order.subtotal_inr) - discount + delivery);
  }
  return Number(order.total_inr);
}

export function partnerOrderPaidInr(order: PartnerOrder): number {
  if (order.paid_inr != null) return Number(order.paid_inr);
  return order.payment_status === 'paid' ? partnerOrderTicketTotalInr(order) : 0;
}

export function partnerOrderPendingInr(order: PartnerOrder): number {
  return Math.max(0, partnerOrderTicketTotalInr(order) - partnerOrderPaidInr(order));
}

export function partnerOrderHasUnpaidBalance(order: PartnerOrder): boolean {
  return partnerOrderPendingInr(order) > 0;
}
