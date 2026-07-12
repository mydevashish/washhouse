'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SettlementStatusBadge } from '@/features/admin/settlements/settlement-badges';
import { ClientDate } from '@/components/ui/client-date';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { queryKeys } from '@/lib/query-keys';
import {
  addSettlementAdjustment,
  approveSettlement,
  failSettlement,
  getSettlementDetail,
  holdSettlement,
  processSettlement,
  rejectSettlement,
  releaseSettlementHold,
  releaseSettlementPayout,
} from '@/services/settlements';
import { useState } from 'react';
import { SettlementAuditPanel } from '@/features/admin/settlements/settlement-audit-panel';

type Props = {
  settlementId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function SettlementDetailDrawer({ settlementId, open, onOpenChange, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [payoutRef, setPayoutRef] = useState('');

  const detailQ = useQuery({
    queryKey: queryKeys.adminSettlementDetail(settlementId ?? ''),
    queryFn: () => getSettlementDetail(settlementId!),
    enabled: Boolean(settlementId) && open,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettlementDetail(settlementId ?? '') });
    onUpdated();
  };

  const actionM = useMutation({
    mutationFn: async (input: { action: string; payload?: Record<string, string> }) => {
      const id = settlementId!;
      switch (input.action) {
        case 'approve':
          return approveSettlement(id);
        case 'process':
          return processSettlement(id);
        case 'release':
          return releaseSettlementPayout(id, input.payload?.payout_reference ?? `PAY-${id.slice(0, 8)}`);
        case 'reject':
          return rejectSettlement(id, input.payload?.reason ?? 'Rejected');
        case 'fail':
          return failSettlement(id, input.payload?.reason ?? 'Failed');
        case 'hold':
          return holdSettlement(id, input.payload?.reason ?? 'Held by admin');
        case 'release_hold':
          return releaseSettlementHold(id);
        case 'adjust':
          return addSettlementAdjustment(id, {
            amount_inr: Number(input.payload?.amount_inr),
            reason: input.payload?.reason ?? '',
          });
        default:
          throw new Error('Unknown action');
      }
    },
    onSuccess: () => {
      toast.success('Settlement updated');
      invalidate();
    },
    onError: () => toast.error('Action failed'),
  });

  const d = detailQ.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {d?.settlement_code ?? 'Settlement'}
            {d && <SettlementStatusBadge status={d.status} />}
          </DialogTitle>
        </DialogHeader>

        {detailQ.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}

        {d && (
          <div className="mt-4 space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              <div><dt className="text-muted-foreground">Laundry</dt><dd className="font-medium">{d.laundry_name}</dd></div>
              <div><dt className="text-muted-foreground">Partner</dt><dd>{d.partner_name}</dd></div>
              <div><dt className="text-muted-foreground">Period</dt><dd><ClientDate iso={d.period_start} mode="date" /> – <ClientDate iso={d.period_end} mode="date" /></dd></div>
              <div><dt className="text-muted-foreground">Orders</dt><dd>{d.orders_count}</dd></div>
              <div><dt className="text-muted-foreground">Gross</dt><dd>{formatInr(Number(d.gross_revenue_inr))}</dd></div>
              <div><dt className="text-muted-foreground">Commission</dt><dd>{formatInr(Number(d.commission_inr))}</dd></div>
              <div><dt className="text-muted-foreground">Refunds</dt><dd>{formatInr(Number(d.refund_inr))}</dd></div>
              <div><dt className="text-muted-foreground">Adjustments</dt><dd>{formatInr(Number(d.adjustment_inr))}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Net payout</dt><dd className="text-lg font-semibold">{formatInr(Number(d.net_amount_inr))}</dd></div>
              {d.held_reason && (
                <div className="col-span-2 rounded-md bg-orange-500/10 px-2 py-1.5 text-xs text-orange-800 dark:text-orange-200">
                  On hold: {d.held_reason}
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-2">
              {d.status === 'on_hold' && (
                <Button size="sm" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'release_hold' })}>
                  Release hold
                </Button>
              )}
              {d.status === 'pending' && (
                <Button size="sm" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'approve' })}>Approve</Button>
              )}
              {d.status === 'approved' && (
                <Button size="sm" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'process' })}>Mark processing</Button>
              )}
              {d.status === 'processing' && (
                <>
                  <Input className="h-8 text-xs" placeholder="Payout reference" value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} />
                  <Button size="sm" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'release', payload: { payout_reference: payoutRef || `PAY-${d.id.slice(0, 8)}` } })}>Release payout</Button>
                </>
              )}
              {(d.status === 'pending' || d.status === 'approved' || d.status === 'processing') && (
                <Button size="sm" variant="outline" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'hold', payload: { reason: 'Manual hold' } })}>
                  Hold
                </Button>
              )}
              {(d.status === 'pending' || d.status === 'approved') && (
                <Button size="sm" variant="outline" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'reject', payload: { reason: 'Rejected by admin' } })}>Reject</Button>
              )}
              {d.status === 'processing' && (
                <Button size="sm" variant="destructive" disabled={actionM.isPending} onClick={() => actionM.mutate({ action: 'fail', payload: { reason: 'Bank transfer failed' } })}>Mark failed</Button>
              )}
            </div>

            {d.status !== 'paid' && d.status !== 'cancelled' && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-medium">Manual adjustment</p>
                <Input type="number" className="h-8 text-xs" placeholder="Amount (INR, +/-)" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
                <Input className="h-8 text-xs" placeholder="Reason" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionM.isPending || !adjAmount || !adjReason}
                  onClick={() => actionM.mutate({ action: 'adjust', payload: { amount_inr: adjAmount, reason: adjReason } })}
                >
                  Add adjustment
                </Button>
              </div>
            )}

            {d.line_items.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Orders ({d.line_items.length})</p>
                <div className="max-h-40 overflow-y-auto rounded border border-border text-xs">
                  {d.line_items.map((li) => (
                    <div key={li.order_id} className="flex justify-between border-b border-border/50 px-2 py-1 last:border-0">
                      <span className="font-mono">{li.order_id.slice(0, 8)}</span>
                      <span>{formatInr(Number(li.net_inr))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settlementId && <SettlementAuditPanel settlementId={settlementId} limit={10} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
