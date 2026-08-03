'use client';

import { Loader2, MessageSquare, Phone, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

type Props = {
  phone: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRequest: (id: string) => void;
  onCreateForPhone: (phone: string, name?: string) => void;
};

/** Partner-scoped phone CRM — only requests for this laundry. */
export function PartnerBookingRequestPhoneTimelineDrawer({
  phone,
  open,
  onOpenChange,
  onOpenRequest,
  onCreateForPhone,
}: Props) {
  const timelineQ = usePartnerBookingRequestPhoneTimeline(phone, open);
  const data = timelineQ.data;
  const latestName = data?.requests[0]?.customer_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden />
            Customer timeline
          </DialogTitle>
          <DialogDescription>
            {phone
              ? `Your laundry’s booking requests for ${phone}`
              : 'Select a phone'}
          </DialogDescription>
        </DialogHeader>

        {timelineQ.isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {timelineQ.isError && (
          <InfoBanner variant="destructive" title="Could not load timeline">
            {getApiErrorMessage(timelineQ.error)}
          </InfoBanner>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-medium">{data.phone_e164}</p>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => onCreateForPhone(data.phone_e164, latestName)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New request for this phone
              </Button>
            </div>

            <ul className="space-y-2">
              {data.requests.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1.5 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => {
                      onOpenRequest(r.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold">{r.public_code}</span>
                      <BookingRequestStatusBadge status={r.status} />
                      <BookingRequestPriorityBadge priority={r.priority} />
                    </div>
                    <p className="text-sm font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {BOOKING_REQUEST_SERVICE_LABELS[r.service_type] ?? r.service_type}
                      {' · '}
                      {BOOKING_REQUEST_TIME_LABELS[r.preferred_time_window] ??
                        r.preferred_time_window}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                  </button>
                </li>
              ))}
            </ul>

            {!data.requests.length && (
              <EmptyState
                icon={MessageSquare}
                title="No requests for your laundry"
                description="Create a follow-up booking request for this phone."
              />
            )}

            {data.messages_preview.length > 0 && (
              <div className="space-y-2 border-t border-border/60 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent messages
                </p>
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {data.messages_preview.slice(0, 12).map((m) => (
                    <li key={m.id} className="rounded-md bg-muted/40 px-2.5 py-2 text-xs">
                      <p className="line-clamp-2">{m.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {m.visibility === 'internal' ? 'Internal' : 'Customer-facing'} ·{' '}
                        <ClientDate iso={m.created_at} mode="datetime" />
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
