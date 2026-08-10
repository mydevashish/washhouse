'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import { PartnerOrderTableActionsMenu } from '@/features/partner/components/partner-order-table-actions-menu';
import { PartnerPickupEvidenceDialog } from '@/features/partner/components/partner-pickup-evidence-dialog';
import { CustodyTimelineDialog } from '@/features/chain-of-custody';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { PartnerOrderSourceBadge, isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import { PartnerOrdersEmptyState } from '@/features/partner/orders-hub/partner-orders-empty-state';
import { formatServices } from '@/features/partner/lib/partner-derive';
import {
  getPartnerAdvanceLabel,
  getPartnerNextStatus,
  isOrderNeedsAction,
} from '@/features/partner/lib/partner-status';
import { usePartnerOrderMutations } from '@/features/partner/hooks/use-partner-operations';
import { getPrintLifecycleEmphasis, canPrintBillOrInvoice } from '@/features/partner-shop-floor/lib/print-lifecycle';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { ClientDate } from '@/components/ui/client-date';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder, type PartnerOrdersBucket } from '@/services/partner';
import { getPartnerCustodyTimeline } from '@/services/custody-timeline';

type HubOrdersFilters = {
  bucket?: PartnerOrdersBucket;
  status?: string;
  order_source?: string;
  payment_status?: string;
  created_today?: boolean;
};

export type PartnerOrdersServerList = ReturnType<
  typeof useServerList<PartnerOrder, HubOrdersFilters>
>;

type PartnerOrdersTableFilters = HubOrdersFilters & {
  /** Hub-debounced `q` — overrides useServerList internal search. */
  search?: string;
};

type PartnerOrdersTableProps = {
  /** @deprecated Ignored — table loads server pages. Kept for call-site compatibility. */
  orders?: PartnerOrder[];
  /** @deprecated Prefer `filters.bucket` from hub queue state. */
  filter?: PartnerOrdersBucket;
  /** Hub-controlled API filters (chips + filter bar). */
  filters?: PartnerOrdersTableFilters;
  /** Debounced search from hub URL (`q`). */
  search?: string;
  /** When true, show picture-led empty with clear CTA (active chip/filters/search). */
  hasActiveLens?: boolean;
  onClearFilters?: () => void;
  /** @deprecated Search moves to hub filter bar. */
  showSearch?: boolean;
  /** Hub workspace modal — parent owns pagination footer. */
  hidePagination?: boolean;
  /** When set, uses this list state instead of an internal `useServerList`. */
  serverList?: PartnerOrdersServerList;
};

export function PartnerOrdersTable({
  filter: legacyFilter = 'all',
  filters,
  search = '',
  hasActiveLens = false,
  onClearFilters,
  hidePagination = false,
  serverList,
}: PartnerOrdersTableProps) {
  const [evidenceOrder, setEvidenceOrder] = useState<PartnerOrder | null>(null);
  const [custodyOrder, setCustodyOrder] = useState<PartnerOrder | null>(null);
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation, isBusy } =
    usePartnerOrderMutations();

  const listFilters = useMemo(
    () => ({
      bucket: filters?.bucket ?? legacyFilter,
      status: filters?.status,
      order_source: filters?.order_source,
      payment_status: filters?.payment_status,
      created_today: filters?.created_today,
      // Spreads after useServerList's empty search so hub `q` drives the API.
      search: search.trim() || undefined,
    }),
    [filters, legacyFilter, search],
  );

  const internalList = useServerList<PartnerOrder, PartnerOrdersTableFilters>({
    queryKey: queryKeys.partnerOrders({ surface: 'table' }),
    fetcher: (params) => listPartnerOrders(params),
    filters: listFilters,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
    defaultPageSize: 10,
    enabled: !serverList,
  });

  const list = serverList ?? internalList;

  if (list.isLoading) {
    return (
      <div
        className="space-y-3"
        role="status"
        aria-busy="true"
        aria-live="polite"
        data-testid="partner-orders-table-loading"
      >
        <span className="sr-only">Loading orders</span>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="partner-orders-table-root">
      <div className="flex justify-end px-0.5">
        <span className="text-xs tabular-nums text-muted-foreground">
          {list.totalRecords} orders
        </span>
      </div>
      {list.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 px-4 py-10 text-center"
          data-testid="partner-orders-table-error"
        >
          <p className="text-sm text-destructive">Could not load orders. Check your connection and try again.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => void list.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : list.rows.length === 0 ? (
        <div className="p-4">
          <PartnerOrdersEmptyState
            filtered={hasActiveLens}
            onClearFilters={onClearFilters}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {list.rows.map((o) => (
              <div
                key={o.id}
                className="rounded-3xl border border-border bg-background p-4 shadow-sm"
              >
                <PartnerOrderCard
                  order={o}
                  className="border-0 bg-transparent shadow-none ring-0"
                  onAccept={() => acceptMutation.mutate(o.id)}
                  onReject={() => rejectMutation.mutate(o.id)}
                  onAdvance={() => advanceOrder(o.id, o.status, o.order_source)}
                  isAccepting={acceptMutation.isPending}
                  isRejecting={rejectMutation.isPending}
                  isAdvancing={advanceMutation.isPending}
                />
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-border md:block">
            <div className="overflow-x-auto">
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
                  const printEmphasis = getPrintLifecycleEmphasis(o.status);
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
                      <td className="px-4 py-2 text-right">
                        <PartnerOrderTableActionsMenu
                          orderId={o.id}
                          trackingCode={o.tracking_code}
                          cancelled={o.status === 'cancelled'}
                          needsAction={needsAction}
                          showAdvance={showAdvance}
                          showPhotos={!walkIn && o.status === 'pickup_assigned'}
                          nextLabel={nextLabel}
                          printEmphasis={printEmphasis}
                          showBillInvoice={canPrintBillOrInvoice(o.status)}
                          isBusy={isBusy}
                          isAccepting={acceptMutation.isPending}
                          isRejecting={rejectMutation.isPending}
                          isAdvancing={advanceMutation.isPending}
                          onAccept={() => acceptMutation.mutate(o.id)}
                          onReject={() => rejectMutation.mutate(o.id)}
                          onAdvance={() => advanceOrder(o.id, o.status, o.order_source)}
                          onPhotos={() => setEvidenceOrder(o)}
                          onCustody={() => setCustodyOrder(o)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
          {!hidePagination ? (
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
          ) : null}
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
    </div>
  );
}
