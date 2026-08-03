'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Trash2,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';

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
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { ConfirmActionDialog } from '@/features/admin/components/confirm-action-dialog';
import {
  BookingRequestPriorityBadge,
  BookingRequestStatusBadge,
} from '@/features/admin/booking-requests/booking-request-badges';
import { BookingRequestSlaCell } from '@/features/admin/booking-requests/booking-request-sla-cell';
import {
  BOOKING_REQUEST_PREFERRED_TIMES,
  BOOKING_REQUEST_PRIORITIES,
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_QUICK_STATUSES,
  BOOKING_REQUEST_SERVICES,
  BOOKING_REQUEST_SERVICE_LABELS,
  BOOKING_REQUEST_STATUS_LABELS,
  BOOKING_REQUEST_TIME_LABELS,
  CONVERT_NOT_READY_TOOLTIP,
  TERMINAL_BOOKING_STATUSES,
  type BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';
import {
  useAdminBookingRequestDetail,
  useAdminBookingRequestSuggestLaundries,
  useBookingRequestMutations,
} from '@/features/admin/booking-requests/hooks';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { AdminLaundryRow } from '@/services/admin';

type Props = {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laundries: AdminLaundryRow[];
  onViewPhoneTimeline: (phone: string) => void;
};

const SUGGEST_REASON_LABELS: Record<string, string> = {
  pincode_match: 'Pincode match',
  city_match: 'City match',
  nearest_area: 'Near area',
  highest_rated: 'Top rated',
  recently_active: 'Recently active',
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

export function BookingRequestDetailDrawer({
  requestId,
  open,
  onOpenChange,
  laundries,
  onViewPhoneTimeline,
}: Props) {
  const detailQ = useAdminBookingRequestDetail(requestId, open);
  const d = detailQ.data;
  const suggestQ = useAdminBookingRequestSuggestLaundries(requestId, open);

  const { updateM, claimM, assignM, releaseM, messageM, deleteM, restoreM } =
    useBookingRequestMutations({
      requestId,
      phone: d?.phone_e164,
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
  const [laundryId, setLaundryId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [responseBody, setResponseBody] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<BookingRequestStatus | null>(null);
  const [claimedFor, setClaimedFor] = useState<string | null>(null);

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
    setLaundryId(d.assigned_laundry_id ?? '');
  }, [d]);

  useEffect(() => {
    if (!d || !open || !requestId) return;
    if (d.status !== 'new') return;
    if (claimedFor === requestId) return;
    setClaimedFor(requestId);
    claimM.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.status, open, requestId]);

  const approved = laundries.filter((l) => l.status === 'approved');
  const isTerminal = d ? TERMINAL_BOOKING_STATUSES.has(d.status as BookingRequestStatus) : false;
  const isDeleted = Boolean(d?.deleted_at);

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
    if (status === 'declined' || status === 'cancelled') {
      setConfirmStatus(status);
      return;
    }
    updateM.mutate({ status });
  };

  const handleAssign = () => {
    if (!laundryId) {
      toast.error('Select a laundry');
      return;
    }
    assignM.mutate({ laundryId, note: assignNote || undefined });
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
                  {isDeleted && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Deleted
                    </span>
                  )}
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
                  {d.assigned_laundry_name ? (
                    <>
                      <span>·</span>
                      <span>{d.assigned_laundry_name}</span>
                    </>
                  ) : (
                    <>
                      <span>·</span>
                      <span>Unassigned</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {d.open_duplicate_ids.length > 0 && (
                  <InfoBanner variant="warning" title="Open duplicates">
                    This phone has {d.open_duplicate_ids.length} other open request
                    {d.open_duplicate_ids.length === 1 ? '' : 's'}.
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
                  <span
                    className="inline-flex"
                    title={CONVERT_NOT_READY_TOOLTIP}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled
                    >
                      Convert to order
                    </Button>
                  </span>
                </div>

                <AdminPanel title="SLA & summary" bodyClassName="grid gap-2 p-3 sm:grid-cols-2">
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
                    <p className="text-xs text-muted-foreground">Source: {d.source.replace(/_/g, ' ')}</p>
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
                </AdminPanel>

                <AdminPanel title="Edit details" bodyClassName="space-y-3 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="br-edit-name">Customer name</Label>
                      <Input
                        id="br-edit-name"
                        value={form.customer_name}
                        disabled={isTerminal || isDeleted}
                        onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="br-edit-service">Service</Label>
                      <Select
                        id="br-edit-service"
                        value={form.service_type}
                        disabled={isTerminal || isDeleted}
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
                      <Label htmlFor="br-edit-time">Preferred time</Label>
                      <Select
                        id="br-edit-time"
                        value={form.preferred_time_window}
                        disabled={isTerminal || isDeleted}
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
                      <Label htmlFor="br-edit-priority">Priority</Label>
                      <Select
                        id="br-edit-priority"
                        value={form.priority}
                        disabled={isDeleted}
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
                      <Label htmlFor="br-edit-city">City</Label>
                      <Input
                        id="br-edit-city"
                        value={form.city}
                        disabled={isTerminal || isDeleted}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="br-edit-pincode">Pincode</Label>
                      <Input
                        id="br-edit-pincode"
                        value={form.pincode}
                        disabled={isTerminal || isDeleted}
                        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="br-edit-address">Address / landmark</Label>
                      <Input
                        id="br-edit-address"
                        value={form.address_text}
                        disabled={isTerminal || isDeleted}
                        onChange={(e) => setForm((f) => ({ ...f, address_text: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="br-edit-notes">Notes</Label>
                      <Textarea
                        id="br-edit-notes"
                        rows={2}
                        value={form.notes}
                        disabled={isTerminal || isDeleted}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={updateM.isPending || isDeleted}
                    onClick={saveFields}
                  >
                    {updateM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save fields'}
                  </Button>
                </AdminPanel>

                <AdminPanel title="Assign / transfer" bodyClassName="space-y-3 p-3">
                  {(suggestQ.data?.suggestions?.length ?? 0) > 0 && !isTerminal && !isDeleted && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Suggested
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestQ.data!.suggestions.map((s) => (
                          <button
                            key={s.laundry_id}
                            type="button"
                            className={
                              laundryId === s.laundry_id
                                ? 'rounded-md bg-primary px-2.5 py-1 text-left text-xs font-medium text-primary-foreground'
                                : 'rounded-md bg-muted/60 px-2.5 py-1 text-left text-xs ring-1 ring-border/60 transition-colors hover:bg-muted'
                            }
                            onClick={() => setLaundryId(s.laundry_id)}
                          >
                            <span className="font-medium">{s.name}</span>
                            <span className="ml-1 text-[10px] opacity-80">
                              ★{s.avg_rating.toFixed(1)} ·{' '}
                              {SUGGEST_REASON_LABELS[s.reason] ?? s.reason}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="br-assign-laundry">Laundry</Label>
                    <Select
                      id="br-assign-laundry"
                      value={laundryId}
                      disabled={isDeleted || isTerminal}
                      onChange={(e) => setLaundryId(e.target.value)}
                    >
                      <option value="">Select laundry…</option>
                      {approved.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} · {l.city}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Optional internal note on assign…"
                    rows={2}
                    value={assignNote}
                    disabled={isDeleted || isTerminal}
                    onChange={(e) => setAssignNote(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!laundryId || assignM.isPending || isDeleted || isTerminal}
                      onClick={handleAssign}
                    >
                      {assignM.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : d.assigned_laundry_id ? (
                        'Transfer'
                      ) : (
                        'Assign'
                      )}
                    </Button>
                    {d.assigned_laundry_id && !isTerminal && !isDeleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={releaseM.isPending}
                        onClick={() => releaseM.mutate()}
                      >
                        <Unlink className="h-3.5 w-3.5" aria-hidden />
                        Release
                      </Button>
                    )}
                  </div>
                </AdminPanel>

                <AdminPanel title="Status" bodyClassName="flex flex-wrap gap-2 p-3">
                  {BOOKING_REQUEST_QUICK_STATUSES.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={d.status === s ? 'default' : 'outline'}
                      className="h-8 text-xs"
                      disabled={
                        updateM.isPending ||
                        isDeleted ||
                        d.status === s ||
                        (isTerminal && s !== d.status)
                      }
                      onClick={() => applyStatus(s)}
                    >
                      {BOOKING_REQUEST_STATUS_LABELS[s]}
                    </Button>
                  ))}
                </AdminPanel>

                <AdminPanel title="Respond to customer" bodyClassName="space-y-3 p-3">
                  <Textarea
                    placeholder={`Hi ${d.customer_name}! This is WashHouse regarding booking ${d.public_code}…`}
                    rows={3}
                    value={responseBody}
                    disabled={isDeleted}
                    onChange={(e) => setResponseBody(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!responseBody.trim() || messageM.isPending || isDeleted}
                    onClick={() =>
                      messageM.mutate(
                        { body: responseBody.trim(), visibility: 'customer_facing' },
                        { onSuccess: () => setResponseBody('') },
                      )
                    }
                  >
                    Log customer response
                  </Button>
                </AdminPanel>

                <AdminPanel title="Internal notes" bodyClassName="space-y-3 p-3">
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
                    disabled={isDeleted}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!internalNote.trim() || messageM.isPending || isDeleted}
                    onClick={() =>
                      messageM.mutate(
                        { body: internalNote.trim(), visibility: 'internal' },
                        { onSuccess: () => setInternalNote('') },
                      )
                    }
                  >
                    Add note
                  </Button>
                </AdminPanel>

                <AdminPanel title="Event timeline" bodyClassName="p-3">
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
                </AdminPanel>

                <AdminPanel title="Danger zone" bodyClassName="flex flex-wrap gap-2 p-3">
                  {!isDeleted ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Soft delete
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      disabled={restoreM.isPending}
                      onClick={() => restoreM.mutate()}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Restore
                    </Button>
                  )}
                </AdminPanel>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={(next) => {
          if (!deleteM.isPending) setConfirmDelete(next);
        }}
        title="Soft-delete this booking request?"
        description="It will hide from the default inbox. You can restore it later."
        confirmLabel="Soft delete"
        confirmVariant="destructive"
        pending={deleteM.isPending}
        onConfirm={() =>
          deleteM.mutate(undefined, {
            onSuccess: () => {
              setConfirmDelete(false);
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
        description="This closes the request for ops follow-up. You can still soft-delete or restore later if needed."
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
    </>
  );
}
