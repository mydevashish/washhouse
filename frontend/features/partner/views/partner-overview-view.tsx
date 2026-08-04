'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  AlertTriangle,
  IndianRupee,
  Package,
  PackageCheck,
  Shirt,
  Truck,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { LaundryTrustScoreCard } from '@/features/partner/components/laundry-trust-score-card';
import { PartnerActionCenter } from '@/features/partner/components/partner-action-center';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerOpsFooterStrip } from '@/features/partner/components/partner-ops-footer-strip';
import { PartnerRecentOrdersTable } from '@/features/partner/components/partner-recent-orders-table';
import { buildAttentionItems, isDeliveryStage, isPickupRequest } from '@/features/partner/lib/partner-derive';
import {
  usePartnerAnalytics,
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOperationsDashboard } from '@/services/operations';
import { isOrderNeedsAction } from '@/features/partner/lib/partner-status';

const PartnerStatusOverviewChart = dynamic(
  () =>
    import('@/features/partner/components/partner-status-overview-chart').then(
      (m) => m.PartnerStatusOverviewChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
  },
);

export function PartnerOverviewView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const analyticsQ = usePartnerAnalytics();
  const ordersQ = usePartnerOrders();
  const opsQ = useQuery({
    queryKey: queryKeys.partnerOperationsDashboard(),
    queryFn: getOperationsDashboard,
    enabled: queriesEnabled,
    staleTime: STALE.adminDashboard,
  });
  const stats = mounted && queriesEnabled ? analyticsQ.data : undefined;
  const ops = mounted && queriesEnabled ? opsQ.data : undefined;
  const orders = mounted && queriesEnabled ? (ordersQ.data ?? []) : [];
  const attention = buildAttentionItems(
    orders,
    mounted && queriesEnabled ? Date.now() : undefined,
  );
  const kpisLoading = analyticsQ.isLoading;
  const opsLoading = opsQ.isLoading;
  const ordersLoading = ordersQ.isLoading;

  const needsAction = orders.filter((o) => isOrderNeedsAction(o.status, o.order_source)).length;
  const inProcess = orders.filter(
    (o) =>
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      o.status !== 'ready' &&
      !isOrderNeedsAction(o.status, o.order_source),
  ).length;
  const readyCount = stats?.orders_ready ?? orders.filter((o) => o.status === 'ready').length;
  const pickupCount = ops?.todays_pickups ?? orders.filter((o) => isPickupRequest(o.status)).length;
  const deliveryCount =
    ops?.todays_deliveries ?? orders.filter((o) => isDeliveryStage(o.status)).length;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Dashboard"
        description={stats?.laundry_name ?? 'Today at a glance'}
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" asChild>
              <Link href="/partner/new-order">New Order</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/orders?tab=desk">Find customer</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/orders">All orders</Link>
            </Button>
          </div>
        }
      />

      {analyticsQ.isError && (
        <QueryErrorState
          title="Could not load analytics"
          message={getApiErrorMessage(analyticsQ.error, 'Partner dashboard metrics failed to load')}
          onRetry={() => void analyticsQ.refetch()}
          isRetrying={analyticsQ.isFetching}
        />
      )}
      {opsQ.isError && (
        <QueryErrorState
          title="Could not load operations summary"
          message={getApiErrorMessage(opsQ.error, 'Operations dashboard failed to load')}
          onRetry={() => void opsQ.refetch()}
          isRetrying={opsQ.isFetching}
        />
      )}
      {ordersQ.isError && (
        <QueryErrorState
          title="Could not load orders"
          message={getApiErrorMessage(ordersQ.error, 'Order queue failed to load')}
          onRetry={() => void ordersQ.refetch()}
          isRetrying={ordersQ.isFetching}
        />
      )}

      <PartnerKpiGrid>
        <PartnerKpiCard
          label="Today's orders"
          value={stats ? String(stats.orders_today) : '—'}
          hint="New bookings today"
          icon={Package}
          loading={kpisLoading}
          href="/partner/orders"
        />
        <PartnerKpiCard
          label="Needs action"
          value={String(needsAction || stats?.orders_pending || 0)}
          hint="Accept or reject"
          icon={ClipboardList}
          loading={kpisLoading || ordersLoading}
          accent={needsAction > 0 ? 'warning' : 'default'}
          href="/partner/orders"
        />
        <PartnerKpiCard
          label="In process"
          value={String(inProcess || stats?.orders_in_progress || 0)}
          hint="On the floor"
          icon={Shirt}
          loading={kpisLoading || ordersLoading}
        />
        <PartnerKpiCard
          label="Ready"
          value={String(readyCount)}
          hint="Ready for handover"
          icon={PackageCheck}
          loading={kpisLoading || ordersLoading}
          accent="success"
        />
        <PartnerKpiCard
          label="Today's sales"
          value={stats ? formatInr(Number(stats.revenue_today_inr)) : '—'}
          hint="Delivered today"
          icon={IndianRupee}
          loading={kpisLoading}
          accent="success"
          href="/partner/revenue"
        />
        <PartnerKpiCard
          label="Pending pickup"
          value={String(pickupCount)}
          hint="Scheduled / assigned"
          icon={ClipboardList}
          loading={opsLoading || ordersLoading}
          href="/partner/pickups"
        />
        <PartnerKpiCard
          label="Deliveries out"
          value={String(deliveryCount)}
          hint="Ready or out for delivery"
          icon={Truck}
          loading={opsLoading || ordersLoading}
          href="/partner/deliveries"
        />
        <PartnerKpiCard
          label="Customers"
          value={stats ? String(stats.customers_count) : '—'}
          hint="Served at this laundry"
          icon={Users}
          loading={kpisLoading}
          href="/partner/orders?tab=directory"
        />
      </PartnerKpiGrid>

      <div className="grid gap-4 xl:grid-cols-2">
        {ordersLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <PartnerStatusOverviewChart orders={orders} />
        )}
        {ordersLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <PartnerRecentOrdersTable orders={orders} />
        )}
      </div>

      <PartnerOpsFooterStrip
        pickups={pickupCount}
        deliveries={deliveryCount}
        attention={attention.length}
        lowStockHint={
          ops && ops.delayed_orders > 0 ? `${ops.delayed_orders} delayed` : 'Operations center'
        }
      />

      <LaundryTrustScoreCard />

      {ordersLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : attention.length > 0 ? (
        <PartnerActionCenter items={attention} />
      ) : null}

      {ops && ops.delayed_orders > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-muted/40 px-3 py-2 text-sm text-warning ring-1 ring-warning/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {ops.delayed_orders} delayed order{ops.delayed_orders === 1 ? '' : 's'} past window — check{' '}
            <Link href="/partner/operations" className="font-medium underline">
              Operations center
            </Link>
            .
          </p>
        </div>
      )}
    </PartnerContent>
  );
}
