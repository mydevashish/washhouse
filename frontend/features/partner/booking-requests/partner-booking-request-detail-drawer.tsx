'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  MessageCircle,
  Phone,
  Unlink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmActionDialog } from '@/features/admin/components/confirm-action-dialog';
import {
  BookingRequestPriorityBadge,
  BookingRequestStatusBadge,
} from '@/features/admin/booking-requests/booking-request-badges';
import { BookingRequestConvertDialog } from '@/features/admin/booking-requests/booking-request-convert-dialog';
import { BookingRequestSlaCell } from '@/features/admin/booking-requests/booking-request-sla-cell';
import {
  BOOKING_REQUEST_PREFERRED_TIMES,
  BOOKING_REQUEST_PRIORITIES,
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_SERVICES,
  BOOKING_REQUEST_SERVICE_LABELS,
  BOOKING_REQUEST_STATUS_LABELS,
  BOOKING_REQUEST_TIME_LABELS,
  type BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';
import {
  usePartnerBookingRequestDetail,
  usePartnerBookingRequestMutations,
} from '@/features/partner/booking-requests/hooks';
import {
  canPartnerTransitionStatus,
  isPartnerBookingTerminal,
  partnerQuickStatusesFor,
} from '@/features/partner/booking-requests/lib/partner-booking-status';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { AdminLaundryRow } from '@/services/admin';

type Props = {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewPhoneTimeline: (phone: string) => void;
};

const EVENT_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  status_changed: 'Status changed',
  assigned: 'Assigned',
  transferred: 'Transferred',
  released: 'Released',
  responded: 'Customer response',
  note_added: 'Internal note',
  soft_deleted: 'Soft deleted',
  restored: 'Restored',
  converted: 'Converted',
  expired: 'Expired',
};

export function PartnerBookingRequestDetailDrawer({
  requestId,
  open,
  onOpenChange,
  onViewPhoneTimeline,
}: Props) {
  const router = useRouter();
  const detailQ = usePartnerBookingRequestDetail(requestId, open);
  const d = detailQ.data;

  const { updateM, releaseM, messageM, convertM } = usePartnerBookingRequestMutations({
    requestId,
    phone: d?.phone_e164,
    onSettledSuccess: () => {
      // After release, close — request leaves partner scope (404 on refresh).
    },
  });

  const [form, setForm] = useState({
    customer_name: '',
    service_type: 'wash-fold',
    preferred_time_window: 'flexible',
    notes: '',
    address_text: '',
    city: '',
    pincode: '',
    priority: 'normal',
  });
  const [responseBody, setResponseBody] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<BookingRequestStatus | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    if (!d) return;
    setForm({
      customer_name: d.customer_name,
      service_type: d.service_type,
      preferred_time_window: d.preferred_time_window,
      notes: d.notes ?? '',
      address_text: d.address_text ?? '',
      city: d.city ?? '',
      pincode: d.pincode ?? '',
      priority: d.priority,
    });
  }, [d]);

  const isTerminal = d ? isPartnerBookingTerminal(d.status) : false;
  const canConvert = Boolean(d) && !isTerminal && d!.status === 'confirmed';
  const quickStatuses = d ? partnerQuickStatusesFor(d.status) : [];
  const laundryOptions = useMemo<AdminLaundryRow[]>(() => {
    if (!d?.assigned_laundry_id) return [];
    return [
      {
        id: d.assigned_laundry_id,
        name: d.assigned_laundry_name ?? 'My laundry',
        city: d.city ?? '',
        status: 'approved',
        is_verified: true,
      },
    ];
  }, [d?.assigned_laundry_id, d?.assigned_laundry_name, d?.city]);

  const saveFields = () => {
    updateM.mutate({
      customer_name: form.customer_name.trim(),
      service_type: form.service_type,
      preferred_time_window: form.preferred_time_window,
      notes: form.notes.trim() || null,
      address_text: form.address_text.trim() || null,
      city: form.city.trim() || null,
      pincode: form.pincode.trim() || null,
      priority: form.priority,
    });
  };

  const applyStatus = (status: BookingRequestStatus) => {
    if (!d || !canPartnerTransitionStatus(d.status, status)) return;
    if (status === 'declined' || status === 'cancelled') {
      setConfirmStatus(status);
      return;
    }
    updateM.mutate({ status });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          {detailQ.isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {detailQ.isError && (
            <InfoBanner variant="destructive" title="Could not load request">
              {getApiErrorMessage(detailQ.error)}
            </InfoBanner>
          )}

          {d && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{d.public_code}</span>
                  <BookingRequestStatusBadge status={d.status} />
                  <BookingRequestPriorityBadge priority={d.priority} />
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{d.customer_name}</span>
                  <span>·</span>
                  <button
                    type="button"
                    className="font-mono text-primary underline-offset-2 hover:underline"
                    onClick={() => onViewPhoneTimeline(d.phone_e164)}
                  >
                    {d.phone_e164}
                  </button>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {d.open_duplicate_ids.length > 0 && (
                  <InfoBanner variant="warning" title="Open duplicates">
                    This phone has {d.open_duplicate_ids.length} other open request
                    {d.open_duplicate_ids.length === 1 ? '' : 's'} (your laundry scope).
                  </InfoBanner>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                    <a href={d.whatsapp_url} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      WhatsApp
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    asChild
                  >
                    <a href={`tel:${d.phone_e164}`}>
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      Call
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => onViewPhoneTimeline(d.phone_e164)}
                  >
                    View customer timeline
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={!canConvert || convertM.isPending}
                    onClick={() => setConvertOpen(true)}
                  >
                    Convert to order
                  </Button>
                  {!isTerminal && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setConfirmRelease(true)}
                    >
                      <Unlink className="h-3.5 w-3.5" aria-hidden />
                      Release to admin
                    </Button>
                  )}
                </div>

                <PartnerPanel title="SLA & summary" bodyClassName="grid gap-2 p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">SLA</p>
                    <BookingRequestSlaCell
                      slaBadge={d.sla_badge}
                      slaAgeSeconds={d.sla_age_seconds}
                      createdAt={d.created_at}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Created</p>
                    <p className="font-medium">
                      <ClientDate iso={d.created_at} mode="datetime" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Source: {d.source.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Service</p>
                    <p className="font-medium">
                      {BOOKING_REQUEST_SERVICE_LABELS[d.service_type] ?? d.service_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Preferred window</p>
                    <p className="font-medium">
                      {BOOKING_REQUEST_TIME_LABELS[d.preferred_time_window] ??
                        d.preferred_time_window}
                    </p>
                  </div>
                </PartnerPanel>

                <PartnerPanel title="Edit details" bodyClassName="space-y-3 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="pbr-edit-name">Customer name</Label>
                      <Input
                        id="pbr-edit-name"
                        value={form.customer_name}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pbr-edit-service">Service</Label>
                      <Select
                        id="pbr-edit-service"
                        value={form.service_type}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))}
                      >
                        {BOOKING_REQUEST_SERVICES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pbr-edit-time">Preferred time</Label>
                      <Select
                        id="pbr-edit-time"
                        value={form.preferred_time_window}
                        disabled={isTerminal}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, preferred_time_window: e.target.value }))
                        }
                      >
                        {BOOKING_REQUEST_PREFERRED_TIMES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pbr-edit-priority">Priority</Label>
                      <Select
                        id="pbr-edit-priority"
                        value={form.priority}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      >
                        {BOOKING_REQUEST_PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {BOOKING_REQUEST_PRIORITY_LABELS[p]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pbr-edit-city">City</Label>
                      <Input
                        id="pbr-edit-city"
                        value={form.city}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pbr-edit-pincode">Pincode</Label>
                      <Input
                        id="pbr-edit-pincode"
                        value={form.pincode}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="pbr-edit-address">Address / landmark</Label>
                      <Input
                        id="pbr-edit-address"
                        value={form.address_text}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, address_text: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="pbr-edit-notes">Notes</Label>
                      <Textarea
                        id="pbr-edit-notes"
                        rows={2}
                        value={form.notes}
                        disabled={isTerminal}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={updateM.isPending || isTerminal}
                    onClick={saveFields}
                  >
                    {updateM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save fields'}
                  </Button>
                </PartnerPanel>

                {quickStatuses.length > 0 && (
                  <PartnerPanel title="Status" bodyClassName="flex flex-wrap gap-2 p-3">
                    {quickStatuses.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={d.status === s ? 'default' : 'outline'}
                        className="h-8 text-xs"
                        disabled={updateM.isPending}
                        onClick={() => applyStatus(s)}
                      >
                        {BOOKING_REQUEST_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  </PartnerPanel>
                )}

                <PartnerPanel title="Respond to customer" bodyClassName="space-y-3 p-3">
                  <Textarea
                    placeholder={`Hi ${d.customer_name}! This is WashHouse regarding booking ${d.public_code}…`}
                    rows={3}
                    value={responseBody}
                    disabled={isTerminal}
                    onChange={(e) => setResponseBody(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!responseBody.trim() || messageM.isPending || isTerminal}
                    onClick={() =>
                      messageM.mutate(
                        { body: responseBody.trim(), visibility: 'customer_facing' },
                        { onSuccess: () => setResponseBody('') },
                      )
                    }
                  >
                    Log customer response
                  </Button>
                </PartnerPanel>

                <PartnerPanel title="Internal notes" bodyClassName="space-y-3 p-3">
                  <ul className="max-h-36 space-y-2 overflow-y-auto">
                    {d.messages
                      .filter((m) => m.visibility === 'internal')
                      .map((m) => (
                        <li key={m.id} className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                          <p>{m.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {m.author_role} · <ClientDate iso={m.created_at} mode="datetime" />
                          </p>
                        </li>
                      ))}
                    {!d.messages.some((m) => m.visibility === 'internal') && (
                      <p className="text-xs text-muted-foreground">No internal notes yet.</p>
                    )}
                  </ul>
                  <Textarea
                    placeholder="Add internal note…"
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!internalNote.trim() || messageM.isPending}
                    onClick={() =>
                      messageM.mutate(
                        { body: internalNote.trim(), visibility: 'internal' },
                        { onSuccess: () => setInternalNote('') },
                      )
                    }
                  >
                    Add note
                  </Button>
                </PartnerPanel>

                <PartnerPanel title="Event timeline" bodyClassName="p-3">
                  <ul className="space-y-2">
                    {[...d.events].reverse().map((ev) => (
                      <li
                        key={ev.id}
                        className="flex gap-3 border-l-2 border-border pl-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {EVENT_LABELS[ev.event_type] ?? ev.event_type.replace(/_/g, ' ')}
                          </p>
                          {(ev.from_status || ev.to_status) && (
                            <p className="text-muted-foreground">
                              {ev.from_status ?? '—'} → {ev.to_status ?? '—'}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            <ClientDate iso={ev.created_at} mode="datetime" />
                          </p>
                        </div>
                      </li>
                    ))}
                    {!d.events.length && (
                      <p className="text-xs text-muted-foreground">No events yet.</p>
                    )}
                  </ul>
                </PartnerPanel>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={confirmRelease}
        onOpenChange={(next) => {
          if (!releaseM.isPending) setConfirmRelease(next);
        }}
        title="Release this request to admin?"
        description="It leaves your queue and returns to the WashHouse ops inbox. You will no longer see it."
        confirmLabel="Release"
        confirmVariant="destructive"
        pending={releaseM.isPending}
        onConfirm={() =>
          releaseM.mutate(undefined, {
            onSuccess: () => {
              setConfirmRelease(false);
              onOpenChange(false);
            },
          })
        }
      />

      <ConfirmActionDialog
        open={Boolean(confirmStatus)}
        onOpenChange={(next) => {
          if (!updateM.isPending && !next) setConfirmStatus(null);
        }}
        title={`Mark as ${confirmStatus ? BOOKING_REQUEST_STATUS_LABELS[confirmStatus] : ''}?`}
        description="This closes the request for your laundry follow-up."
        confirmLabel="Confirm"
        confirmVariant="destructive"
        pending={updateM.isPending}
        onConfirm={() => {
          if (!confirmStatus) return;
          updateM.mutate(
            { status: confirmStatus },
            { onSuccess: () => setConfirmStatus(null) },
          );
        }}
      />

      {d ? (
        <BookingRequestConvertDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          detail={d}
          laundries={laundryOptions}
          pending={convertM.isPending}
          onSubmit={(payload) => {
            convertM.mutate(
              { ...payload, force: false },
              {
                onSuccess: () => {
                  setConvertOpen(false);
                  onOpenChange(false);
                  router.push(
                    `/partner/customer-desk?phone=${encodeURIComponent(d.phone_e164)}&tab=orders`,
                  );
                },
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
