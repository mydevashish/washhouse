import {
  TERMINAL_BOOKING_STATUSES,
  type BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';
import type { BookingRequestInboxMeta } from '@/features/partner/booking-requests/types';

/** Partner-legal quick status actions (matches backend `_PARTNER_TRANSITIONS`). */
export const PARTNER_BOOKING_QUICK_STATUSES = [
  'contacted',
  'confirmed',
  'declined',
  'cancelled',
] as const satisfies readonly BookingRequestStatus[];

const PARTNER_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  assigned: new Set(['contacted', 'confirmed', 'declined', 'cancelled']),
  contacted: new Set(['confirmed', 'declined', 'cancelled']),
  confirmed: new Set(['cancelled']),
};

export function isPartnerBookingTerminal(status: string): boolean {
  return TERMINAL_BOOKING_STATUSES.has(status as BookingRequestStatus);
}

/** Whether partner may set `next` from `current` via PATCH. */
export function canPartnerTransitionStatus(current: string, next: string): boolean {
  if (current === next) return false;
  if (isPartnerBookingTerminal(current)) return false;
  return PARTNER_TRANSITIONS[current]?.has(next) ?? false;
}

export function partnerQuickStatusesFor(current: string): readonly BookingRequestStatus[] {
  return PARTNER_BOOKING_QUICK_STATUSES.filter((s) => canPartnerTransitionStatus(current, s));
}

/**
 * Nav badge: newly assigned leads needing first contact, plus overdue open rows.
 * Prefer explicit `assignedTotal` from a scoped list query when available.
 */
export function partnerBookingRequestsBadgeCount(input: {
  assignedTotal?: number;
  inbox?: BookingRequestInboxMeta | null;
}): number {
  const assigned = Math.max(0, input.assignedTotal ?? 0);
  const overdue = Math.max(0, input.inbox?.overdue ?? 0);
  // Overdue is a subset of open pre-contact; avoid double-counting when assigned is known.
  if (input.assignedTotal !== undefined) return assigned;
  return overdue;
}
