'use client';

import { cn } from '@/lib/utils';
import {
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_SLA_LABELS,
  BOOKING_REQUEST_STATUS_LABELS,
  type BookingRequestPriority,
  type BookingRequestSlaBadge,
  type BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-warning-muted text-warning',
  reviewing: 'bg-primary/10 text-primary',
  assigned: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  contacted: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  confirmed: 'bg-success-muted text-success',
  converted_to_order: 'bg-success-muted text-success',
  declined: 'bg-danger-muted text-danger',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

const PRIORITY_STYLES: Record<string, string> = {
  normal: 'bg-muted text-muted-foreground',
  high: 'bg-warning-muted text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const SLA_STYLES: Record<string, string> = {
  fresh: 'bg-success-muted text-success',
  aging: 'bg-warning-muted text-warning',
  overdue: 'bg-destructive/10 text-destructive',
  met: 'bg-success-muted text-success',
  na: 'bg-muted text-muted-foreground',
};

export function BookingRequestStatusBadge({ status }: { status: string }) {
  const label =
    BOOKING_REQUEST_STATUS_LABELS[status as BookingRequestStatus] ?? status.replace(/_/g, ' ');
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap capitalize',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function BookingRequestPriorityBadge({ priority }: { priority: string }) {
  const label =
    BOOKING_REQUEST_PRIORITY_LABELS[priority as BookingRequestPriority] ?? priority;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
        PRIORITY_STYLES[priority] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function BookingRequestSlaBadge({ badge }: { badge: string }) {
  const label = BOOKING_REQUEST_SLA_LABELS[badge as BookingRequestSlaBadge] ?? badge;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        SLA_STYLES[badge] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
