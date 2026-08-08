/**
 * Shop Floor simplified statuses — map onto real OrderStatus without a new enum.
 * See docs/features/partner-shop-floor.md §Simplified status mapping.
 */

import {
  getPartnerNextStatus,
  PARTNER_NEXT_STATUS,
} from '@/features/partner/lib/partner-status';

export const FLOOR_STATUSES = ['received', 'washing', 'ready', 'given'] as const;

export type FloorStatus = (typeof FLOOR_STATUSES)[number];

export type FloorFilter = 'all' | FloorStatus;

export type FloorAction = 'accept' | 'start_wash' | 'mark_ready' | 'mark_given';

export const FLOOR_STATUS_LABELS: Record<
  FloorStatus,
  { hinglish: string; english: string }
> = {
  received: { hinglish: 'Received', english: 'Received' },
  washing: { hinglish: 'Washing', english: 'Washing' },
  ready: { hinglish: 'Ready', english: 'Ready' },
  given: { hinglish: 'Given', english: 'Given' },
};

/** English primary CTA for the next simplified step. */
export const FLOOR_ACTION_LABELS: Record<FloorAction, string> = {
  accept: 'Accept order',
  start_wash: 'Start washing',
  mark_ready: 'Mark ready',
  mark_given: 'Mark given',
};

const RECEIVED_STATUSES = new Set(['confirmed', 'pickup_assigned', 'picked_up']);
const WASHING_STATUSES = new Set(['washing', 'ironing']);
const READY_STATUSES = new Set(['ready']);
const GIVEN_STATUSES = new Set(['out_for_delivery', 'delivered']);

export function toFloorStatus(
  status: string,
  orderSource?: 'online' | 'walk_in' | null,
): FloorStatus | null {
  if (status === 'cancelled') return null;

  if (orderSource === 'walk_in') {
    if (status === 'confirmed') return 'received';
    if (status === 'washing') return 'washing';
    if (status === 'ready') return 'ready';
    if (status === 'delivered') return 'given';
    return null;
  }

  if (RECEIVED_STATUSES.has(status)) return 'received';
  if (WASHING_STATUSES.has(status)) return 'washing';
  if (READY_STATUSES.has(status)) return 'ready';
  if (GIVEN_STATUSES.has(status)) return 'given';
  return null;
}

export function phoneLast4(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return digits || null;
  return digits.slice(-4);
}

export type FloorAdvancePlan = {
  floorStatus: FloorStatus;
  action: FloorAction;
  label: string;
  /** Statuses to PATCH in order (after optional accept). */
  patchStatuses: string[];
  /** Call POST /accept before patches. */
  acceptFirst: boolean;
};

/**
 * One primary CTA plan for the next simplified floor step.
 * Uses existing accept + status graphs; may chain doorstep washing→ironing→ready.
 */
export function getFloorAdvancePlan(
  status: string,
  orderSource?: 'online' | 'walk_in' | null,
): FloorAdvancePlan | null {
  const floorStatus = toFloorStatus(status, orderSource);
  if (!floorStatus || floorStatus === 'given') return null;

  const isWalkIn = orderSource === 'walk_in';

  if (floorStatus === 'received') {
    if (isWalkIn) {
      return {
        floorStatus,
        action: 'start_wash',
        label: FLOOR_ACTION_LABELS.start_wash,
        patchStatuses: ['washing'],
        acceptFirst: false,
      };
    }
    if (status === 'confirmed') {
      return {
        floorStatus,
        action: 'accept',
        label: FLOOR_ACTION_LABELS.accept,
        patchStatuses: [],
        acceptFirst: true,
      };
    }
    if (status === 'picked_up') {
      return {
        floorStatus,
        action: 'start_wash',
        label: FLOOR_ACTION_LABELS.start_wash,
        patchStatuses: ['washing'],
        acceptFirst: false,
      };
    }
    // pickup_assigned → next single partner step (picked_up) when evidence allows
    const next = getPartnerNextStatus(status, orderSource);
    if (!next) return null;
    return {
      floorStatus,
      action: 'start_wash',
      label: FLOOR_ACTION_LABELS.start_wash,
      patchStatuses: [next],
      acceptFirst: false,
    };
  }

  if (floorStatus === 'washing') {
    if (isWalkIn) {
      return {
        floorStatus,
        action: 'mark_ready',
        label: FLOOR_ACTION_LABELS.mark_ready,
        patchStatuses: ['ready'],
        acceptFirst: false,
      };
    }
    // One-tap to Ready: washing → ironing → ready
    const chain: string[] = [];
    let cursor = status;
    while (cursor !== 'ready') {
      const next = PARTNER_NEXT_STATUS[cursor];
      if (!next) break;
      chain.push(next);
      cursor = next;
      if (chain.length > 4) break;
    }
    if (chain.length === 0) return null;
    return {
      floorStatus,
      action: 'mark_ready',
      label: FLOOR_ACTION_LABELS.mark_ready,
      patchStatuses: chain,
      acceptFirst: false,
    };
  }

  if (floorStatus === 'ready') {
    if (isWalkIn) {
      return {
        floorStatus,
        action: 'mark_given',
        label: FLOOR_ACTION_LABELS.mark_given,
        patchStatuses: ['delivered'],
        acceptFirst: false,
      };
    }
    return {
      floorStatus,
      action: 'mark_given',
      label: FLOOR_ACTION_LABELS.mark_given,
      patchStatuses: ['out_for_delivery'],
      acceptFirst: false,
    };
  }

  return null;
}

export type FloorBoardCounts = {
  received: number;
  washing: number;
  ready: number;
  given: number;
  /** Open work on Today board (Received + Washing). */
  todayAttention: number;
  /** Ready handoff queue. */
  readyAttention: number;
};

export function countFloorOrders(
  orders: Array<{ status: string; order_source?: 'online' | 'walk_in' | null }>,
): FloorBoardCounts {
  const counts: FloorBoardCounts = {
    received: 0,
    washing: 0,
    ready: 0,
    given: 0,
    todayAttention: 0,
    readyAttention: 0,
  };

  for (const order of orders) {
    const floor = toFloorStatus(order.status, order.order_source);
    if (!floor) continue;
    counts[floor] += 1;
  }

  counts.todayAttention = counts.received + counts.washing;
  counts.readyAttention = counts.ready;
  return counts;
}

export function filterFloorOrders<
  T extends { status: string; order_source?: 'online' | 'walk_in' | null },
>(orders: T[], filter: FloorFilter, includeGiven: boolean): T[] {
  return orders.filter((order) => {
    const floor = toFloorStatus(order.status, order.order_source);
    if (!floor) return false;
    if (floor === 'given' && !includeGiven) return false;
    if (filter === 'all') return floor !== 'given' || includeGiven;
    return floor === filter;
  });
}

export function pieceCount(
  items: Array<{ quantity: number }> | null | undefined,
): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}
