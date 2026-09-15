import { isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import type { PartnerOrder } from '@/services/partner';

export type PickupGateContext = {
  hasEvidence: boolean;
  hasInventory: boolean;
};

type PickupGateOrder = Pick<PartnerOrder, 'status' | 'order_source'> & {
  items?: PartnerOrder['items'];
};

export function orderHasLineGarments(order: { items?: PartnerOrder['items'] }): boolean {
  return (order.items ?? []).some((item) => (item.garments?.length ?? 0) > 0);
}

/** Doorstep orders need pickup photos before picked_up. Walk-in never needs photos. */
export function needsPickupEvidence(order: PickupGateOrder): boolean {
  return !isWalkInOrder(order) && order.status === 'pickup_assigned';
}

/**
 * Inventory is required before processing starts unless garments were already
 * recorded on the order lines (walk-in / counter intake).
 */
export function needsPickupInventory(order: PickupGateOrder): boolean {
  if (isWalkInOrder(order)) return false;
  if (orderHasLineGarments(order)) return false;
  return order.status === 'pickup_assigned';
}

export function getPickupAdvanceBlockers(
  order: PickupGateOrder,
  ctx: PickupGateContext,
): string[] {
  const blockers: string[] = [];
  if (needsPickupEvidence(order) && !ctx.hasEvidence) {
    blockers.push('Upload pickup photos');
  }
  if (needsPickupInventory(order) && !ctx.hasInventory) {
    blockers.push('Record item inventory');
  }
  return blockers;
}

/** Human-readable reason for disabled advance CTA (button title + helper copy). */
export function getPickupAdvanceDisabledReason(blockers: string[]): string | null {
  if (blockers.length === 0) return null;
  if (blockers.length === 1) return `${blockers[0]} before continuing`;
  const second = blockers[1];
  if (!second) return `${blockers[0]} before continuing`;
  return `${blockers[0]} and ${second.toLowerCase()} before continuing`;
}

export function canAdvancePastPickupGates(order: PickupGateOrder, ctx: PickupGateContext): boolean {
  return getPickupAdvanceBlockers(order, ctx).length === 0;
}
