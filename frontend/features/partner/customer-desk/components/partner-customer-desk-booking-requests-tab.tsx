'use client';

import { Loader2, MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import {
  BookingRequestPriorityBadge,
  BookingRequestStatusBadge,
} from '@/features/admin/booking-requests/booking-request-badges';
import { BookingRequestSlaCell } from '@/features/admin/booking-requests/booking-request-sla-cell';
import {
  BOOKING_REQUEST_SERVICE_LABELS,
  BOOKING_REQUEST_TIME_LABELS,
} from '@/features/admin/booking-requests/constants';
import { usePartnerBookingRequestPhoneTimeline } from '@/features/partner/booking-requests/hooks';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

type Props = {
  phone: string | null;
  open: boolean;
  onCreateBookingRequest: () => void;
};

/** Booking requests assigned to this laundry for the desk phone. */
export function PartnerCustomerDeskBookingRequestsTab({
  phone,
  open,
  onCreateBookingRequest,
}: Props) {
  const timelineQ = usePartnerBookingRequestPhoneTimeline(phone, open);
  const data = timelineQ.data;

  if (timelineQ.isLoading) {
    return (
      <div className="flex justify-center py-10" aria-busy="true" aria-label="Loading booking requests">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (timelineQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load booking requests">
        {getApiErrorMessage(timelineQ.error)}
      </InfoBanner>
    );
  }

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {requests.length
            ? `${requests.length} request${requests.length === 1 ? '' : 's'} for this phone (your laundry)`
            : 'No booking requests assigned to your laundry'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
            <Link href={buildOrdersHubPath('/partner/orders', 'requests', { phone: phone ?? '' })}>
              Open inbox
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={onCreateBookingRequest}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New request
          </Button>
        </div>
      </div>

      {requests.length > 0 ? (
        <ul className="space-y-2" aria-label="Booking requests for this phone">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-xs font-semibold">{r.public_code}</span>
                <BookingRequestStatusBadge status={r.status} />
                <BookingRequestPriorityBadge priority={r.priority} />
              </div>
              <p className="mt-1 text-sm font-medium">{r.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {BOOKING_REQUEST_SERVICE_LABELS[r.service_type] ?? r.service_type}
                {' · '}
                {BOOKING_REQUEST_TIME_LABELS[r.preferred_time_window] ?? r.preferred_time_window}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <BookingRequestSlaCell
                  slaBadge={r.sla_badge}
                  slaAgeSeconds={r.sla_age_seconds}
                  createdAt={r.created_at}
                  compact
                />
                <ClientDate
                  iso={r.created_at}
                  mode="datetime"
                  className="text-[11px] text-muted-foreground"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No booking requests"
          description="Create a request for this phone if you want it in your booking-request inbox."
          secondaryAction={{ label: 'Create booking request', onClick: onCreateBookingRequest }}
        />
      )}
    </div>
  );
}
