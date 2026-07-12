import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';

/** Next status in the fulfillment flow (partner advances one step at a time). */
export const PARTNER_NEXT_STATUS: Record<string, string> = {
  pickup_assigned: 'picked_up',
  picked_up: 'washing',
  washing: 'ironing',
  ironing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

/** Large-button labels partners understand quickly. */
export const PARTNER_ACTION_LABEL: Record<string, string> = {
  pickup_assigned: 'Mark picked up',
  picked_up: 'Start washing',
  washing: 'Start ironing',
  ironing: 'Mark ready',
  ready: 'Out for delivery',
  out_for_delivery: 'Mark delivered',
};

export function getPartnerActionLabel(currentStatus: string): string | null {
  const next = PARTNER_NEXT_STATUS[currentStatus];
  if (!next) return null;
  return PARTNER_ACTION_LABEL[currentStatus] ?? `Move to ${getOrderStatusLabel(next)}`;
}

export function getNextStatus(currentStatus: string): string | null {
  return PARTNER_NEXT_STATUS[currentStatus] ?? null;
}

export function isOrderActive(status: string): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}

export function isOrderNeedsAction(
  status: string,
  orderSource?: 'online' | 'walk_in' | null,
): boolean {
  if (orderSource === 'walk_in') return false;
  return status === 'confirmed';
}

/** Walk-in orders skip pickup/delivery — confirmed through delivered in-shop. */
export const WALK_IN_NEXT_STATUS: Record<string, string> = {
  confirmed: 'washing',
  washing: 'ready',
  ready: 'delivered',
};

export const WALK_IN_ACTION_LABEL: Record<string, string> = {
  confirmed: 'Start washing',
  washing: 'Mark ready',
  ready: 'Mark delivered',
};

export function getPartnerNextStatus(
  status: string,
  orderSource?: 'online' | 'walk_in' | null,
): string | null {
  if (orderSource === 'walk_in') return getWalkInNextStatus(status);
  return getNextStatus(status);
}

export function getPartnerAdvanceLabel(
  status: string,
  orderSource?: 'online' | 'walk_in' | null,
): string | null {
  if (orderSource === 'walk_in') return getWalkInActionLabel(status);
  return getPartnerActionLabel(status);
}

export function getWalkInNextStatus(currentStatus: string): string | null {
  return WALK_IN_NEXT_STATUS[currentStatus] ?? null;
}

export function getWalkInActionLabel(currentStatus: string): string | null {
  const next = WALK_IN_NEXT_STATUS[currentStatus];
  if (!next) return null;
  return WALK_IN_ACTION_LABEL[currentStatus] ?? `Move to ${getOrderStatusLabel(next)}`;
}

export function isWalkInOrderActive(status: string): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}
