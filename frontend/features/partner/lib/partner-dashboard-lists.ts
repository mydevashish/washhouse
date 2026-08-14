import { formatInr } from '@/features/discover/detail/order-pricing';
import { parseDashboardInr } from '@/features/partner/lib/partner-dashboard-kpi-cards';
import { PARTNER_CUSTOMERS_HREF, PARTNER_NEW_ORDER_HREF, PARTNER_ORDERS_HREF } from '@/features/partner/lib/partner-nav';
import type { CustomerInsightRow } from '@/services/customer-insights';
import type { PartnerOrder } from '@/services/partner';

export const PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF = PARTNER_ORDERS_HREF;
export const PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF = PARTNER_CUSTOMERS_HREF;
export const PARTNER_DASHBOARD_CREATE_ORDER_HREF = PARTNER_NEW_ORDER_HREF;

export type PartnerDashboardRecentOrderRow = {
  id: string;
  href: string;
  trackingCode: string;
  customer: string;
  service: string;
  amount: string;
  statusPill: string;
};

export type PartnerDashboardCustomerRow = {
  userId: string;
  href: string;
  name: string;
  initial: string;
  ordersLabel: string;
  spent: string;
};

export function partnerDashboardOrderHref(orderId: string): string {
  return `/partner/orders/${orderId}`;
}

/** Spec: first service name, or “N items” when more than one line. */
export function partnerDashboardOrderServiceLabel(
  items: PartnerOrder['items'] | undefined,
): string {
  if (!items?.length) return '—';
  if (items.length === 1) return items[0]?.service_name.trim() || '—';
  return `${items.length} items`;
}

export function partnerDashboardStatusPill(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'pickup_assigned':
      return 'Pending';
    case 'picked_up':
    case 'washing':
    case 'ironing':
      return 'In Process';
    case 'ready':
      return 'Ready';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function mapPartnerDashboardRecentOrders(
  orders: PartnerOrder[] | undefined,
): PartnerDashboardRecentOrderRow[] {
  return (orders ?? []).map((order) => ({
    id: order.id,
    href: partnerDashboardOrderHref(order.id),
    trackingCode: order.tracking_code,
    customer: order.customer_name,
    service: partnerDashboardOrderServiceLabel(order.items),
    amount: formatInr(parseDashboardInr(order.total_inr)),
    statusPill: partnerDashboardStatusPill(order.status),
  }));
}

export function mapPartnerDashboardTopCustomers(
  customers: CustomerInsightRow[] | undefined,
): PartnerDashboardCustomerRow[] {
  return (customers ?? []).map((customer) => {
    const name = customer.name.trim() || 'Customer';
    return {
      userId: customer.user_id,
      href: PARTNER_CUSTOMERS_HREF,
      name,
      initial: name.slice(0, 1).toUpperCase(),
      ordersLabel: `${customer.order_count.toLocaleString('en-IN')} orders`,
      spent: formatInr(parseDashboardInr(customer.lifetime_spend_inr)),
    };
  });
}
