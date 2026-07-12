import type { Order, OrderStatusEvent } from '@/services/orders';

export type OrderWsMessage =
  | { type: 'connected'; order_id: string; status: string }
  | {
      type: 'status_update';
      order_id: string;
      status: string;
      event: OrderStatusEvent;
    }
  | { type: 'pong' }
  | { type: 'ping' }
  | { type: 'error'; message: string };

export function parseOrderWsMessage(raw: string): OrderWsMessage | null {
  try {
    const data = JSON.parse(raw) as OrderWsMessage;
    if (!data || typeof data !== 'object' || !('type' in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function applyStatusUpdateToOrder(order: Order, message: Extract<OrderWsMessage, { type: 'status_update' }>): Order {
  const events = order.events ?? [];
  const exists = events.some((e) => e.id === message.event.id);
  const nextEvents = exists ? events : [...events, message.event];
  return {
    ...order,
    status: message.status,
    events: nextEvents,
  };
}

export function getOrderWebSocketUrl(orderId: string, accessToken: string, apiBaseUrl: string): string {
  const httpOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  const wsOrigin = httpOrigin.replace(/^http/i, (match) => (match.toLowerCase() === 'https' ? 'wss' : 'ws'));
  const params = new URLSearchParams({ token: accessToken });
  return `${wsOrigin}/api/v1/ws/orders/${orderId}?${params.toString()}`;
}
