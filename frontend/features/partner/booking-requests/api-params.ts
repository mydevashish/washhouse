import type { BookingRequestListFilters } from '@/features/partner/booking-requests/types';

/** Partner list query params — strips IDOR-sensitive client filters (never trust laundry scope from client). */
export function buildPartnerBookingListParams(
  filters: BookingRequestListFilters,
): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (k === 'include_deleted' || k === 'unassigned' || k === 'assigned_laundry_id') return;
    if (v !== undefined && v !== '' && v !== false) p[k] = v as string | number | boolean;
  });
  return p;
}
