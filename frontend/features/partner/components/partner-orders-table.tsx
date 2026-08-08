'use client';

import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder, type PartnerOrdersBucket } from '@/services/partner';
import { getPartnerCustodyTimeline } from '@/services/custody-timeline';
import { cn } from '@/lib/utils';

type Filter = PartnerOrdersBucket;

type PartnerOrdersTableProps = {
  /** @deprecated Ignored — table loads server pages. Kept for call-site compatibility. */
  orders?: PartnerOrder[];
  filter?: Filter;
  showSearch?: boolean;
};

export function PartnerOrdersTable({
  filter: initialFilter = 'all',
  showSearch = true,
}: PartnerOrdersTableProps) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [evidenceOrder, setEvidenceOrder] = useState<PartnerOrder | null>(null);
  const [custodyOrder, setCustodyOrder] = useState<PartnerOrder | null>(null);
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation, isBusy } =
    usePartnerOrderMutations();

  const list = useServerList<PartnerOrder, { bucket: Filter }>({
    queryKey: queryKeys.partnerOrders({ surface: 'table' }),
    fetcher: (params) => listPartnerOrders(params),
    filters: { bucket: filter },
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
    defaultPageSize: 10,
  });

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
              'min-h-[44px] rounded-md px-2.5 py-1.5 text-xs font-medium sm:min-h-[36px] sm:py-1',
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
          value={list.search}
          onChange={(e) => list.setSearch(e.target.value)}
          className="h-control w-full min-w-[140px] sm:w-44"
          aria-label="Search orders"
        />
      )}
    </div>
  );

  if (list.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <PartnerPanel
      meta={<span className="tabular-nums">{list.totalRecords} orders</span>}
      toolbar={toolbar}
      bodyClassName="p-0"
    >
      {list.isError ? (
        <p className="px-4 py-8 text-center text-sm text-destructive">Could not load orders.</p>
      ) : list.rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders in this view.</p>
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {list.rows.map((o) => (
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
                {list.rows.map((o) => {
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
                          <Link
                            href={`/partner/orders/${o.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            #{o.tracking_code}
                          </Link>
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
                                className="min-h-[44px]"
                                disabled={isBusy}
                                aria-busy={acceptMutation.isPending}
                                aria-label={
                                  acceptMutation.isPending
                                    ? `Accepting order ${o.tracking_code}`
                                    : `Accept order ${o.tracking_code}`
                                }
                                onClick={() => acceptMutation.mutate(o.id)}
                              >
                                {acceptMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                    Accepting…
                                  </>
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
                                className="min-h-[44px]"
                                disabled={isBusy}
                                aria-busy={advanceMutation.isPending}
                                aria-label={
                                  advanceMutation.isPending
                                    ? `Updating order ${o.tracking_code}`
                                    : `${nextLabel} for order ${o.tracking_code}`
                                }
                                onClick={() => advanceOrder(o.id, o.status, o.order_source)}
                              >
                                {advanceMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                    Updating…
                                  </>
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
          <DataTablePagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            pageStart={list.pageStart}
            pageEnd={list.pageEnd}
            totalCount={list.totalRecords}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
          />
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
        loadTimeline={getPartnerCustodyTimeline}
      />
    </PartnerPanel>
  );
}
