import type { PartnerOrder } from '@/services/partner';

export function partnerOrderPaidInr(order: PartnerOrder): number {
  if (order.paid_inr != null) return Number(order.paid_inr);
  return order.payment_status === 'paid' ? Number(order.total_inr) : 0;
}

export function partnerOrderPendingInr(order: PartnerOrder): number {
  if (order.pending_inr != null) return Number(order.pending_inr);
  return Math.max(0, Number(order.total_inr) - partnerOrderPaidInr(order));
}

export function partnerOrderHasUnpaidBalance(order: PartnerOrder): boolean {
  return partnerOrderPendingInr(order) > 0;
}
