import type { OperationsOrderRow } from '@/services/operations';
import type { PartnerOrder } from '@/services/partner';
import { OWNER_IMAGES } from '@/features/partner/components/owner/owner-assets';

export type LogisticsBoardTab = 'pickups' | 'deliveries' | 'done';

export type LogisticsRunFamily = 'pickup' | 'ready' | 'out' | 'done';

export function logisticsRunFamily(status: string): LogisticsRunFamily {
  if (status === 'delivered') return 'done';
  if (status === 'out_for_delivery') return 'out';
  if (status === 'ready') return 'ready';
  return 'pickup';
}

export function logisticsRunImage(family: LogisticsRunFamily): { src: string; alt: string } {
  switch (family) {
    case 'out':
      return { src: OWNER_IMAGES.emptyLogistics, alt: 'Delivery in progress' };
    case 'ready':
      return { src: OWNER_IMAGES.calm, alt: 'Ready for handoff' };
    case 'done':
      return { src: OWNER_IMAGES.calm, alt: 'Completed run' };
    default:
      return { src: OWNER_IMAGES.logistics, alt: 'Pickup run' };
  }
}

export function flattenQueueOrders(
  buckets: { status?: string; orders: OperationsOrderRow[] }[] | undefined,
  /** When set, only include these queue_status values (active board columns). */
  includeStatuses?: readonly string[],
): OperationsOrderRow[] {
  if (!buckets?.length) return [];
  const allowed = includeStatuses ? new Set(includeStatuses) : null;
  const seen = new Set<string>();
  const rows: OperationsOrderRow[] = [];
  for (const bucket of buckets) {
    if (allowed && bucket.status && !allowed.has(bucket.status)) continue;
    for (const order of bucket.orders) {
      if (allowed && !allowed.has(order.queue_status)) continue;
      if (seen.has(order.order_id)) continue;
      seen.add(order.order_id);
      rows.push(order);
    }
  }
  return rows;
}

export function filterLogisticsRuns<T extends {
  customer_name: string;
  tracking_code: string;
  customer_phone?: string | null;
}>(
  rows: T[],
  query: string,
  staffName?: string | null,
  getStaffName?: (row: T) => string | null | undefined,
): T[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (staffName) {
      const assigned = (getStaffName?.(row) ?? '').toLowerCase();
      if (assigned !== staffName.toLowerCase()) return false;
    }
    if (!q) return true;
    const phone = row.customer_phone ?? '';
    const hay = `${row.customer_name} ${row.tracking_code} ${phone}`.toLowerCase();
    return hay.includes(q);
  });
}

export function deliveredToday(orders: PartnerOrder[], now = new Date()): PartnerOrder[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  return orders.filter((o) => {
    if (o.status !== 'delivered') return false;
    // Partner list may not expose updated_at — treat all delivered in list as candidates
    // Prefer delivery_at when available.
    const t = new Date(o.delivery_at).getTime();
    return Number.isFinite(t) ? t >= startMs : true;
  });
}

export function matchesLogisticsSearch(order: PartnerOrder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const phone = order.customer_phone ?? '';
  const token = order.token_code ?? '';
  return `${order.customer_name} ${order.tracking_code} ${phone} ${token}`.toLowerCase().includes(q);
}
