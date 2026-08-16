'use client';

import Link from 'next/link';
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PARTNER_DASHBOARD_RECENT_ORDER_FILTER_LABELS,
  PARTNER_DASHBOARD_RECENT_ORDER_FILTERS,
  partnerDashboardRecentOrderHubHref,
  partnerDashboardRecentOrdersListParams,
  partnerDashboardRecentOrdersViewAllHref,
  type PartnerDashboardRecentOrderFilter,
} from '@/features/partner/dashboard/partner-dashboard-recent-orders-filter';
import { PartnerOrderTableActionsMenu } from '@/features/partner/components/partner-order-table-actions-menu';
import { PartnerPickupEvidenceDialog } from '@/features/partner/components/partner-pickup-evidence-dialog';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import { buildCustomerWhatsAppUrl } from '@/features/partner/customer-desk/phone';
import { buildWalkInOrderReceivedWhatsAppBody } from '@/features/partner/lib/walk-in-order-received-whatsapp';
import {
  usePartnerOrderMutations,
  usePartnerOrders,
} from '@/features/partner/hooks/use-partner-operations';
import { formatPartnerOrderDeliveryAddress } from '@/features/partner/lib/partner-order-address';
import {
  getPartnerAdvanceLabel,
  getPartnerNextStatus,
  isOrderNeedsAction,
} from '@/features/partner/lib/partner-status';
import { CustodyTimelineDialog } from '@/features/chain-of-custody';
import { getPrintLifecycleEmphasis, canPrintBillOrInvoice } from '@/features/partner-shop-floor/lib/print-lifecycle';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import { getPartnerCustodyTimeline } from '@/services/custody-timeline';
import type { PartnerOrder } from '@/services/partner';

const FILTER_TOOLBAR =
  'inline-flex h-8 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium sm:h-9 sm:px-3 sm:text-sm';

type PartnerDashboardRecentOrdersProps = {
  /** Prompt 5 wires PartnerCreateOrderDialog here. */
  onCreateOrder?: () => void;
};

function RecentOrdersStatusFilter({
  value,
  onChange,
}: {
  value: PartnerDashboardRecentOrderFilter;
  onChange: (next: PartnerDashboardRecentOrderFilter) => void;
}) {
  const liveId = useId();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const focusAt = useCallback((index: number) => {
    const root = toolbarRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>('[data-recent-filter-focusable="true"]');
    focusables[index]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const focusables = Array.from(
        toolbarRef.current?.querySelectorAll<HTMLElement>('[data-recent-filter-focusable="true"]') ??
          [],
      );
      if (focusables.length === 0) return;
      const current = focusables.indexOf(document.activeElement as HTMLElement);
      let next = current < 0 ? 0 : current;
      if (event.key === 'ArrowRight') next = (current + 1) % focusables.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + focusables.length) % focusables.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = focusables.length - 1;
      focusAt(next);
    },
    [focusAt],
  );

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Recent orders status filter"
      aria-describedby={liveId}
      className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onKeyDown={onKeyDown}
    >
      <span id={liveId} className="sr-only">
        {PARTNER_DASHBOARD_RECENT_ORDER_FILTER_LABELS[value]} selected
      </span>
      {PARTNER_DASHBOARD_RECENT_ORDER_FILTERS.map((id) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            data-recent-filter-focusable="true"
            data-testid={`partner-dashboard-recent-filter-${id}`}
            aria-pressed={selected}
            className={cn(
              FILTER_TOOLBAR,
              'transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
            onClick={() => onChange(id)}
          >
            {PARTNER_DASHBOARD_RECENT_ORDER_FILTER_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}

function RecentOrderRowActions({ order }: { order: PartnerOrder }) {
  const [evidenceOrder, setEvidenceOrder] = useState<PartnerOrder | null>(null);
  const [custodyOrder, setCustodyOrder] = useState<PartnerOrder | null>(null);
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation, isBusy } =
    usePartnerOrderMutations();

  const needsAction = isOrderNeedsAction(order.status, order.order_source);
  const walkIn = isWalkInOrder(order);
  const nextLabel = getPartnerAdvanceLabel(order.status, order.order_source);
  const nextStatus = getPartnerNextStatus(order.status, order.order_source);
  const hasNext = Boolean(nextStatus);
  const showAdvance =
    !needsAction &&
    hasNext &&
    order.status !== 'cancelled' &&
    (walkIn || order.status !== 'out_for_delivery');
  const printEmphasis = getPrintLifecycleEmphasis(order.status);
  const hubHref = partnerDashboardRecentOrderHubHref(order);
  const whatsappHref = order.customer_phone
    ? buildCustomerWhatsAppUrl(
        order.customer_phone,
        walkIn
          ? buildWalkInOrderReceivedWhatsAppBody({
              customer_name: order.customer_name,
              tracking_code: order.tracking_code,
              total_inr: order.total_inr,
              payment_status: order.payment_status,
              delivery_at: order.delivery_at,
              expected_ready_at: order.delivery_at,
              token_code: order.token_code,
              color_token: order.color_token,
              items: order.items,
            })
          : `Hi, this is regarding your laundry order #${order.tracking_code}.`,
      )
    : null;

  return (
    <>
      <PartnerOrderTableActionsMenu
        orderId={order.id}
        trackingCode={order.tracking_code}
        cancelled={order.status === 'cancelled'}
        needsAction={needsAction}
        showAdvance={showAdvance}
        showPhotos={!walkIn && order.status === 'pickup_assigned'}
        nextLabel={nextLabel}
        printEmphasis={printEmphasis}
        showBillInvoice={canPrintBillOrInvoice(order.status)}
        isBusy={isBusy}
        isAccepting={acceptMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isAdvancing={advanceMutation.isPending}
        onAccept={() => acceptMutation.mutate(order.id)}
        onReject={() => rejectMutation.mutate(order.id)}
        onAdvance={() => advanceOrder(order.id, order.status, order.order_source)}
        onPhotos={() => setEvidenceOrder(order)}
        onCustody={() => setCustodyOrder(order)}
        hubHref={hubHref}
        whatsappHref={whatsappHref}
        tagsLabel={printEmphasis === 'bill' ? 'Reprint labels' : 'Print tags'}
        detailLabel="Open order detail"
      />
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
    </>
  );
}

function RecentOrderCard({ order }: { order: PartnerOrder }) {
  const address = formatPartnerOrderDeliveryAddress(order);
  const createdIso = order.created_at ?? order.pickup_at;

  return (
    <article
      className="rounded-xl border border-border bg-background p-4 shadow-sm"
      data-testid="partner-dashboard-recent-order-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium text-foreground">{order.customer_name}</p>
          {order.customer_phone ? (
            <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
          ) : null}
          <p className="truncate text-xs text-muted-foreground" title={address}>
            {address}
          </p>
        </div>
        <PartnerStatusBadge status={order.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground/80">Created</dt>
          <dd>
            <ClientDate iso={createdIso} mode="datetime" />
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/80">Pickup / delivery</dt>
          <dd className="space-y-0.5">
            <div>
              <ClientDate iso={order.pickup_at} mode="delivery" />
            </div>
            <div>
              <ClientDate iso={order.delivery_at} mode="delivery" />
            </div>
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-end">
        <RecentOrderRowActions order={order} />
      </div>
    </article>
  );
}

export function PartnerDashboardRecentOrders({ onCreateOrder }: PartnerDashboardRecentOrdersProps) {
  const [filter, setFilter] = useState<PartnerDashboardRecentOrderFilter>('all');
  const listParams = useMemo(
    () => ({
      page: 1,
      page_size: 10,
      sort_by: 'created_at' as const,
      sort_order: 'desc' as const,
      ...partnerDashboardRecentOrdersListParams(filter),
    }),
    [filter],
  );
  const ordersQ = usePartnerOrders(listParams);
  const viewAllHref = partnerDashboardRecentOrdersViewAllHref(filter);
  const rows = ordersQ.data?.items ?? [];

  return (
    <section aria-label="Recent orders" data-testid="partner-dashboard-recent-orders">
      <PartnerOpsSurface className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent orders</h2>
          <p className="text-sm text-muted-foreground">Latest 10 orders for the selected status.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => onCreateOrder?.()}
          data-testid="partner-dashboard-create-order"
        >
          Create order
        </Button>
      </div>

      <RecentOrdersStatusFilter value={filter} onChange={setFilter} />

      {ordersQ.isLoading ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading recent orders</span>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : ordersQ.isError ? (
        <QueryErrorState
          title="Could not load recent orders"
          message={getApiErrorMessage(ordersQ.error, 'Orders failed to load')}
          onRetry={() => void ordersQ.refetch()}
          isRetrying={ordersQ.isFetching}
        />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No orders match this filter.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((order) => (
              <RecentOrderCard key={order.id} order={order} />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-sticky-head border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Phone</th>
                    <th className="hidden px-4 py-2 font-semibold lg:table-cell">Delivery address</th>
                    <th className="px-4 py-2 font-semibold">Created</th>
                    <th className="hidden px-4 py-2 font-semibold sm:table-cell">Pickup / delivery</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((order) => {
                    const address = formatPartnerOrderDeliveryAddress(order);
                    const createdIso = order.created_at ?? order.pickup_at;
                    return (
                      <tr key={order.id} className="h-table-row hover:bg-muted/30">
                        <td className="max-w-[140px] truncate px-4 py-2 font-medium">
                          {order.customer_name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                          {order.customer_phone ?? '—'}
                        </td>
                        <td
                          className="hidden max-w-[180px] truncate px-4 py-2 text-xs text-muted-foreground lg:table-cell"
                          title={address}
                        >
                          {address}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                          <ClientDate iso={createdIso} mode="datetime" />
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-2 text-xs text-muted-foreground sm:table-cell">
                          <div className="space-y-0.5">
                            <div>
                              <span className="text-muted-foreground/80">P </span>
                              <ClientDate iso={order.pickup_at} mode="delivery" />
                            </div>
                            <div>
                              <span className="text-muted-foreground/80">D </span>
                              <ClientDate iso={order.delivery_at} mode="delivery" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <PartnerStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <RecentOrderRowActions order={order} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end border-t border-border/60 pt-3">
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-primary hover:underline"
          data-testid="partner-dashboard-recent-view-all"
        >
          View all
        </Link>
      </div>
      </PartnerOpsSurface>
    </section>
  );
}
