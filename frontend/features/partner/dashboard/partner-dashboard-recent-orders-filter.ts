import { buildPartnerOrdersQueuePath } from '@/features/partner/orders-hub/partner-orders-hub-queue';
import type { PartnerOrdersListParams } from '@/services/partner';

export const PARTNER_DASHBOARD_RECENT_ORDER_FILTERS = [
  'all',
  'needs_action',
  'processing',
  'ready',
  'delivered',
  'cancelled',
] as const;

export type PartnerDashboardRecentOrderFilter =
  (typeof PARTNER_DASHBOARD_RECENT_ORDER_FILTERS)[number];

export const PARTNER_DASHBOARD_RECENT_ORDER_FILTER_LABELS: Record<
  PartnerDashboardRecentOrderFilter,
  string
> = {
  all: 'All',
  needs_action: 'Needs action',
  processing: 'Processing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Map dashboard status lens → list API params (existing buckets / status filters only). */
export function partnerDashboardRecentOrdersListParams(
  filter: PartnerDashboardRecentOrderFilter,
): Pick<PartnerOrdersListParams, 'bucket' | 'status'> {
  switch (filter) {
    case 'needs_action':
      return { bucket: 'action' };
    case 'processing':
      return { bucket: 'active' };
    case 'ready':
      return { bucket: 'all', status: 'ready' };
    case 'delivered':
      return { bucket: 'all', status: 'delivered' };
    case 'cancelled':
      return { bucket: 'all', status: 'cancelled' };
    case 'all':
    default:
      return { bucket: 'all' };
  }
}

/** Deep-link hub orders tab with equivalent queue params. */
export function partnerDashboardRecentOrdersViewAllHref(
  filter: PartnerDashboardRecentOrderFilter,
): string {
  switch (filter) {
    case 'needs_action':
      return buildPartnerOrdersQueuePath({ chip: 'needs_action' });
    case 'ready':
      return buildPartnerOrdersQueuePath({ chip: null, status: 'ready' });
    case 'delivered':
      return buildPartnerOrdersQueuePath({ chip: null, status: 'delivered' });
    case 'cancelled':
      return buildPartnerOrdersQueuePath({ chip: null, status: 'cancelled' });
    case 'processing':
    case 'all':
    default:
      return buildPartnerOrdersQueuePath({ chip: null });
  }
}

export function partnerDashboardRecentOrderHubHref(order: {
  tracking_code: string;
  customer_phone?: string | null;
  customer_name?: string;
}): string {
  const phone = order.customer_phone?.trim();
  if (phone) {
    return buildPartnerOrdersQueuePath({
      chip: 'all',
      phone,
      customer: order.customer_name?.trim() || null,
      q: order.tracking_code,
    });
  }
  return buildPartnerOrdersQueuePath({ chip: 'all', q: order.tracking_code });
}
