import { isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import type { PartnerOrder } from '@/services/partner';

/** One-line delivery address for partner tables (walk-in → counter copy). */
export function formatPartnerOrderDeliveryAddress(order: PartnerOrder): string {
  if (isWalkInOrder(order)) {
    return 'Counter pickup';
  }
  const parts = [
    order.address_line1,
    order.address_line2,
    order.address_city,
    order.address_pincode,
  ]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
}
