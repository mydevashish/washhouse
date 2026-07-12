import { isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import type { PartnerAnalytics, PartnerOrder } from '@/services/partner';

export type AttentionItem = {
  id: string;
  type: 'new_order' | 'pickup' | 'payment' | 'delivery_delay' | 'ready';
  title: string;
  description: string;
  orderId: string;
  trackingCode: string;
  status: string;
  orderSource?: 'online' | 'walk_in';
  primaryAction?: 'accept' | 'reject' | 'advance' | 'view';
};

export function isPickupRequest(status: string): boolean {
  return status === 'confirmed' || status === 'pickup_assigned';
}

export function isDeliveryStage(status: string): boolean {
  return status === 'ready' || status === 'out_for_delivery';
}

export function formatServices(order: PartnerOrder): string {
  if (!order.items?.length) return '—';
  return order.items.map((i) => `${i.quantity}× ${i.service_name}`).join(', ');
}

export function buildAttentionItems(orders: PartnerOrder[], nowMs?: number): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const o of orders) {
    if (o.status === 'confirmed' && !isWalkInOrder(o)) {
      items.push({
        id: `new-${o.id}`,
        type: 'new_order',
        title: 'New order — accept or reject',
        description: `${o.customer_name} · ${formatServices(o)}`,
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        primaryAction: 'accept',
      });
      continue;
    }
    if (o.status === 'confirmed' && isWalkInOrder(o)) {
      items.push({
        id: `walkin-${o.id}`,
        type: 'pickup',
        title: 'Walk-in order — start processing',
        description: `${o.customer_name} · ${o.customer_phone ?? ''}`.trim(),
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        orderSource: o.order_source,
        primaryAction: 'advance',
      });
      continue;
    }
    if (o.status === 'pickup_assigned') {
      items.push({
        id: `pickup-${o.id}`,
        type: 'pickup',
        title: 'Pickup scheduled',
        description: `${o.customer_name} · assign or mark picked up`,
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        orderSource: o.order_source,
        primaryAction: 'advance',
      });
    }
    if (
      (o.payment_status === 'pending' || o.payment_status === 'pending_cod') &&
      o.status !== 'cancelled' &&
      o.status !== 'delivered'
    ) {
      items.push({
        id: `pay-${o.id}`,
        type: 'payment',
        title: 'Payment pending',
        description: `Order #${o.tracking_code}`,
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        primaryAction: 'view',
      });
    }
    const deliveryMs = new Date(o.delivery_at).getTime();
    if (
      nowMs !== undefined &&
      o.status === 'out_for_delivery' &&
      deliveryMs < nowMs
    ) {
      items.push({
        id: `delay-${o.id}`,
        type: 'delivery_delay',
        title: 'Delivery delayed',
        description: `#${o.tracking_code} · ${o.customer_name}`,
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        orderSource: o.order_source,
        primaryAction: 'advance',
      });
    }
    if (o.status === 'ready') {
      items.push({
        id: `ready-${o.id}`,
        type: 'ready',
        title: isWalkInOrder(o) ? 'Walk-in ready for collection' : 'Ready for delivery',
        description: isWalkInOrder(o)
          ? `#${o.tracking_code} · ${o.customer_name}`
          : `#${o.tracking_code} · dispatch now`,
        orderId: o.id,
        trackingCode: o.tracking_code,
        status: o.status,
        orderSource: o.order_source,
        primaryAction: 'advance',
      });
    }
  }

  return items.slice(0, 12);
}

export function partnerBadges(
  analytics?: PartnerAnalytics,
  orders?: PartnerOrder[],
  nowMs?: number,
) {
  const pendingOrders =
    orders?.filter((o) => o.status === 'confirmed' && !isWalkInOrder(o)).length ??
    analytics?.orders_pending ??
    0;
  const pickups = orders?.filter((o) => isPickupRequest(o.status)).length ?? analytics?.pickup_requests ?? 0;
  const notifications = buildAttentionItems(orders ?? [], nowMs).length || pendingOrders;

  return { orders: pendingOrders, pickups, notifications };
}
