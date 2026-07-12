'use client';

import { Loader2, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerPickupEvidenceDialog } from '@/features/partner/components/partner-pickup-evidence-dialog';
import { CustodyTimelineDialog } from '@/features/chain-of-custody';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { PartnerOrderSourceBadge, isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import { formatServices } from '@/features/partner/lib/partner-derive';
import {
  getPartnerAdvanceLabel,
  getPartnerNextStatus,
  isOrderNeedsAction,
} from '@/features/partner/lib/partner-status';
import { usePartnerOrderMutations } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { ClientDate } from '@/components/ui/client-date';
import type { PartnerOrder } from '@/services/partner';
import { getPartnerCustodyTimeline } from '@/services/custody-timeline';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'action' | 'active' | 'done';

type PartnerOrdersTableProps = {
  orders: PartnerOrder[];
  filter?: Filter;
  showSearch?: boolean;
};

export function PartnerOrdersTable({ orders, filter: initialFilter = 'all', showSearch = true }: PartnerOrdersTableProps) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState('');
  const [evidenceOrder, setEvidenceOrder] = useState<PartnerOrder | null>(null);
  const [custodyOrder, setCustodyOrder] = useState<PartnerOrder | null>(null);
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation, isBusy } =
    usePartnerOrderMutations();

  const filtered = useMemo(() => {
    let rows = orders;
    const q = search.toLowerCase();
    if (q) {
      rows = rows.filter(
        (o) =>
          o.tracking_code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q),
      );
    }
    switch (filter) {
      case 'action':
        return rows.filter((o) => isOrderNeedsAction(o.status, o.order_source));
      case 'active':
        return rows.filter(
          (o) =>
            o.status !== 'delivered' &&
            o.status !== 'cancelled' &&
            !isOrderNeedsAction(o.status, o.order_source),
        );
      case 'done':
        return rows.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
      default:
        return rows;
    }
  }, [orders, filter, search]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'action', label: 'Needs action' },
    { id: 'active', label: 'In progress' },
    { id: 'done', label: 'Completed' },
    { id: 'all', label: 'All' },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg bg-muted/60 p-0.5" role="tablist" aria-label="Order filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'min-h-[36px] rounded-md px-2.5 py-1 text-xs font-medium',
              filter === f.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {showSearch && (
        <Input
          type="search"
          placeholder="Search orders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-control w-full min-w-[140px] sm:w-44"
          aria-label="Search orders"
        />
      )}
    </div>
  );

  return (
    <PartnerPanel
      meta={<span className="tabular-nums">{filtered.length} orders</span>}
      toolbar={toolbar}
      bodyClassName="p-0"
    >
      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders in this view.</p>
      ) : (
        <>
          {/* Mobile: card stack */}
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((o) => (
              <PartnerOrderCard
                key={o.id}
                order={o}
                onAccept={() => acceptMutation.mutate(o.id)}
                onReject={() => rejectMutation.mutate(o.id)}
                onAdvance={() => advanceOrder(o.id, o.status, o.order_source)}
                isAccepting={acceptMutation.isPending}
                isRejecting={rejectMutation.isPending}
                isAdvancing={advanceMutation.isPending}
              />
            ))}
          </div>

          {/* Desktop: compact table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="table-sticky-head border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">Order</th>
                  <th className="px-4 py-2 font-semibold">Customer</th>
                  <th className="hidden px-4 py-2 font-semibold lg:table-cell">Services</th>
                  <th className="px-4 py-2 font-semibold">Amount</th>
                  <th className="hidden px-4 py-2 font-semibold sm:table-cell">Pickup</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((o) => {
                  const needsAction = isOrderNeedsAction(o.status, o.order_source);
                  const walkIn = isWalkInOrder(o);
                  const nextLabel = getPartnerAdvanceLabel(o.status, o.order_source);
                  const nextStatus = getPartnerNextStatus(o.status, o.order_source);
                  const hasNext = Boolean(nextStatus);
                  const showAdvance =
                    !needsAction &&
                    hasNext &&
                    o.status !== 'cancelled' &&
                    (walkIn || o.status !== 'out_for_delivery');
                  return (
                    <tr key={o.id} className="h-table-row hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs font-medium">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>#{o.tracking_code}</span>
                          <PartnerOrderSourceBadge order={o} />
                        </div>
                      </td>
                      <td className="max-w-[120px] truncate px-4 py-2">{o.customer_name}</td>
                      <td className="hidden max-w-[140px] truncate px-4 py-2 text-xs text-muted-foreground lg:table-cell">
                        {formatServices(o)}
                      </td>
                      <td className="px-4 py-2 tabular-nums font-medium">{formatInr(Number(o.total_inr))}</td>
                      <td className="hidden whitespace-nowrap px-4 py-2 text-xs text-muted-foreground sm:table-cell">
                        <ClientDate iso={o.pickup_at} />
                      </td>
                      <td className="px-4 py-2">
                        <PartnerStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1.5">
                          {needsAction && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => acceptMutation.mutate(o.id)}
                              >
                                {acceptMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  'Accept'
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => rejectMutation.mutate(o.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {showAdvance && (
                            <>
                              {!walkIn && o.status === 'pickup_assigned' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => setEvidenceOrder(o)}
                                >
                                  Photos
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => setCustodyOrder(o)}
                                aria-label={`Chain of custody for order ${o.tracking_code}`}
                              >
                                <Shield className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => advanceOrder(o.id, o.status, o.order_source)}
                              >
                              {advanceMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                nextLabel
                              )}
                            </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <PartnerPickupEvidenceDialog
        order={evidenceOrder}
        open={Boolean(evidenceOrder)}
        onOpenChange={(open) => !open && setEvidenceOrder(null)}
      />
      <CustodyTimelineDialog
        orderId={custodyOrder?.id ?? null}
        trackingCode={custodyOrder?.tracking_code ?? null}
        open={Boolean(custodyOrder)}
        onOpenChange={(open) => !open && setCustodyOrder(null)}
        queryFn={getPartnerCustodyTimeline}
        scope="partner"
      />
    </PartnerPanel>
  );
}
