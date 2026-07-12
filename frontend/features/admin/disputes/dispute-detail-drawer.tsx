'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { FraudRiskBadge } from '@/features/admin/components/fraud-risk-badge';
import { DisputeFraudRiskPanel } from '@/features/admin/disputes/dispute-fraud-risk-panel';
import { DisputeSlaCell } from '@/features/admin/disputes/dispute-sla-cell';
import {
  DisputePriorityBadge,
  DisputeStatusBadge,
  DisputeTypeBadge,
} from '@/features/admin/disputes/dispute-badges';
import { EvidenceComparisonView } from '@/features/admin/disputes/evidence/evidence-comparison-view';
import { ChainOfCustodyTimeline } from '@/features/chain-of-custody';
import { DisputePhotosGallery } from '@/features/disputes/components/dispute-photos-gallery';
import { DisputeStatusTimeline } from '@/features/disputes/components/dispute-status-timeline';
import { InventoryVerificationDisplay } from '@/features/inventory-verification';
import { ClientDate } from '@/components/ui/client-date';
import { queryKeys } from '@/lib/query-keys';
import {
  DISPUTE_STATUSES,
  DISPUTE_STATUS_LABELS,
  addDisputeInternalNote,
  getDisputeAdminDetail,
  updateDisputeStatus,
  type DisputeStatus,
} from '@/services/disputes';

type Props = {
  disputeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DisputeDetailDrawer({ disputeId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<DisputeStatus>('investigating');
  const [statusNote, setStatusNote] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const detailQ = useQuery({
    queryKey: queryKeys.adminDisputeDetail(disputeId ?? ''),
    queryFn: () => getDisputeAdminDetail(disputeId!),
    enabled: Boolean(disputeId && open),
  });

  useEffect(() => {
    if (detailQ.data) {
      setNewStatus(detailQ.data.status as DisputeStatus);
    }
  }, [detailQ.data]);

  const statusM = useMutation({
    mutationFn: () =>
      updateDisputeStatus(disputeId!, {
        status: newStatus,
        note: statusNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Status updated');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputesTable({}) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputeDetail(disputeId!) });
      setStatusNote('');
    },
    onError: () => toast.error('Status update failed'),
  });

  const noteM = useMutation({
    mutationFn: () => addDisputeInternalNote(disputeId!, internalNote),
    onSuccess: () => {
      toast.success('Note added');
      setInternalNote('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputeDetail(disputeId!) });
    },
    onError: () => toast.error('Could not add note'),
  });

  const d = detailQ.data;
  const hasEvidence = Boolean(d && (d.pickup_evidence.length > 0 || d.delivery_proof));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hasEvidence ? 'max-h-[92vh] max-w-4xl overflow-y-auto' : 'max-h-[92vh] max-w-2xl overflow-y-auto'}>
        {detailQ.isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {d && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Dispute {d.id.slice(0, 8)}
                <DisputeTypeBadge label={d.type_label} type={d.complaint_type} />
                <DisputePriorityBadge label={d.priority_label} priority={d.priority} />
                <DisputeStatusBadge label={d.status_label} status={d.status} />
                {d.fraud_risk && (
                  <span className="ml-auto hidden sm:inline-flex">
                    <FraudRiskBadge level={d.fraud_risk.overall_risk_level} />
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                Order #{d.tracking_code ?? '—'} · {d.customer_name}
                {d.laundry_name ? ` · ${d.laundry_name}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              {d.fraud_risk && (
                <DisputeFraudRiskPanel
                  risk={d.fraud_risk}
                  customerName={d.customer_name}
                  partnerName={d.partner_name}
                />
              )}

              <AdminPanel title="Summary" bodyClassName="grid gap-2 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Customer</p>
                  <p className="font-medium">{d.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{d.customer_email}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Partner / laundry</p>
                  <p className="font-medium">{d.partner_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{d.laundry_name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Assigned to</p>
                  <p className="font-medium">{d.assigned_to_name ?? 'Unassigned'}</p>
                  {d.assigned_at && (
                    <p className="text-xs text-muted-foreground">
                      Since <ClientDate iso={d.assigned_at} mode="datetime" />
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Created</p>
                  <p className="font-medium">
                    <ClientDate iso={d.created_at} mode="datetime" />
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[11px] text-muted-foreground">SLA</p>
                  <DisputeSlaCell row={d} />
                </div>
                <p className="sm:col-span-2 text-muted-foreground">{d.description}</p>
              </AdminPanel>

              <AdminPanel title="Resolution center" bodyClassName="space-y-3 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="drawer-status">Status</Label>
                    <Select
                      id="drawer-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as DisputeStatus)}
                    >
                      {DISPUTE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {DISPUTE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Status change note (audit logged)…"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                />
                <Button type="button" size="sm" disabled={statusM.isPending} onClick={() => statusM.mutate()}>
                  {statusM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update status'}
                </Button>
              </AdminPanel>

              <AdminPanel title="Internal notes" bodyClassName="space-y-3 p-3">
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {d.internal_notes.map((n) => (
                    <li key={n.id} className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <p className="font-medium">
                        {n.author_name ?? 'Admin'}
                        {n.is_edited && <span className="ml-1 text-muted-foreground">(edited)</span>}
                      </p>
                      <p className="mt-0.5">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        <ClientDate iso={n.created_at} mode="datetime" />
                      </p>
                    </li>
                  ))}
                  {!d.internal_notes.length && (
                    <p className="text-xs text-muted-foreground">No internal notes yet.</p>
                  )}
                </ul>
                <Textarea
                  placeholder="Add internal note…"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={2}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!internalNote.trim() || noteM.isPending}
                  onClick={() => noteM.mutate()}
                >
                  Add note
                </Button>
              </AdminPanel>

              {d.status_events.length > 0 && (
                <AdminPanel title="Timeline" bodyClassName="p-3">
                  <DisputeStatusTimeline events={d.status_events} />
                </AdminPanel>
              )}

              {d.photos.length > 0 && (
                <DisputePhotosGallery photos={d.photos} title="Customer attachments" />
              )}
              {(d.pickup_evidence.length > 0 || d.delivery_proof) && (
                <EvidenceComparisonView
                  pickupPhotos={d.pickup_evidence}
                  deliveryPhoto={d.delivery_proof}
                />
              )}
              {d.inventory_verification && (
                <InventoryVerificationDisplay verification={d.inventory_verification} title="Inventory" />
              )}
              {d.custody_timeline && d.custody_timeline.events.length > 0 && (
                <AdminPanel title="Chain of custody" bodyClassName="p-3">
                  <ChainOfCustodyTimeline events={d.custody_timeline.events} showMetadata />
                </AdminPanel>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
