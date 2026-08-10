import type { WalkInOrder } from '@/services/partner-walk-in-orders';
import { formatOrderItemsSummary } from '@/features/partner/lib/format-order-items-summary';

function formatReadyWindow(iso: string | null | undefined): string {
  if (!iso) return 'We will confirm ready time at the shop';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'We will confirm ready time at the shop';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date);
}

function formatPaymentSummary(totalInr: string | number, paymentStatus: string): string {
  const total = Number(totalInr);
  const formatted = Number.isFinite(total) ? total.toFixed(2) : String(totalInr);
  if (paymentStatus === 'paid') {
    return `Total paid: ₹${formatted}`;
  }
  return `Total: ₹${formatted} — balance due at pickup/collection`;
}

function formatBagToken(order: Pick<WalkInOrder, 'token_code' | 'color_token'>): string {
  if (!order.token_code) return '—';
  const color = order.color_token ? ` (${order.color_token})` : '';
  return `${order.token_code}${color}`;
}

/** Plain-text order-received body (matches backend formatter for wa.me fallback). */
export function buildWalkInOrderReceivedWhatsAppBody(
  order: Pick<
    WalkInOrder,
    | 'customer_name'
    | 'tracking_code'
    | 'total_inr'
    | 'payment_status'
    | 'delivery_at'
    | 'expected_ready_at'
    | 'token_code'
    | 'color_token'
    | 'items'
  >,
  laundryName = 'your laundry',
): string {
  const itemsSummary = formatOrderItemsSummary(order.items) ?? 'Items as discussed';
  const readyIso = order.expected_ready_at ?? order.delivery_at;
  const variables = {
    customer_name: order.customer_name.trim() || 'Customer',
    tracking_code: order.tracking_code,
    laundry_name: laundryName,
    status_label: 'received',
    items_summary: itemsSummary,
    bag_token: formatBagToken(order),
    ready_window: formatReadyWindow(readyIso),
    payment_summary: formatPaymentSummary(order.total_inr, order.payment_status),
  };

  return (
    `Hi ${variables.customer_name}! We've received your laundry order ${variables.tracking_code} at ${variables.laundry_name}.\n` +
    `Items: ${variables.items_summary}\n` +
    `Bag token: ${variables.bag_token}\n` +
    `Ready by: ${variables.ready_window}\n` +
    `${variables.payment_summary}\n` +
    `Status: ${variables.status_label}. We'll notify you as it progresses. Thank you for choosing DLM.`
  );
}

export function walkInOrderWhatsAppEligible(order: Pick<WalkInOrder, 'customer_phone'>): boolean {
  return /^\+[1-9]\d{9,14}$/.test(order.customer_phone.trim());
}
