import {
  BOOK_NOW_PREFERRED_TIMES,
  BOOK_NOW_SERVICES,
} from '@/features/marketing/book-now/book-now-constants';

export const BOOKING_REQUEST_STATUSES = [
  'new',
  'reviewing',
  'assigned',
  'contacted',
  'confirmed',
  'converted_to_order',
  'declined',
  'expired',
  'cancelled',
] as const;

export type BookingRequestStatus = (typeof BOOKING_REQUEST_STATUSES)[number];

export const BOOKING_REQUEST_STATUS_LABELS: Record<BookingRequestStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  assigned: 'Assigned',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  converted_to_order: 'Converted',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const BOOKING_REQUEST_PRIORITIES = ['normal', 'high', 'urgent'] as const;

export type BookingRequestPriority = (typeof BOOKING_REQUEST_PRIORITIES)[number];

export const BOOKING_REQUEST_PRIORITY_LABELS: Record<BookingRequestPriority, string> = {
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const BOOKING_REQUEST_SLA_BADGES = [
  'fresh',
  'aging',
  'overdue',
  'met',
  'na',
] as const;

export type BookingRequestSlaBadge = (typeof BOOKING_REQUEST_SLA_BADGES)[number];

export const BOOKING_REQUEST_SLA_LABELS: Record<BookingRequestSlaBadge, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  overdue: 'Overdue',
  met: 'Met',
  na: 'N/A',
};

export const BOOKING_REQUEST_SERVICES = BOOK_NOW_SERVICES;
export const BOOKING_REQUEST_PREFERRED_TIMES = BOOK_NOW_PREFERRED_TIMES;

export const BOOKING_REQUEST_SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  BOOK_NOW_SERVICES.map((s) => [s.value, s.label]),
);

export const BOOKING_REQUEST_TIME_LABELS: Record<string, string> = Object.fromEntries(
  BOOK_NOW_PREFERRED_TIMES.map((t) => [t.value, t.label]),
);

/** Statuses that can be set via quick actions in the drawer. */
export const BOOKING_REQUEST_QUICK_STATUSES = [
  'reviewing',
  'confirmed',
  'declined',
  'cancelled',
] as const;

export const TERMINAL_BOOKING_STATUSES = new Set<BookingRequestStatus>([
  'converted_to_order',
  'declined',
  'expired',
  'cancelled',
]);

/** Statuses that can open Convert → assisted order. */
export const CONVERTIBLE_BOOKING_STATUSES = new Set<BookingRequestStatus>([
  'confirmed',
  'contacted',
]);
