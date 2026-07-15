'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardList,
  IndianRupee,
  MapPin,
  Package,
  Star,
  Truck,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LaundryTrustScoreCard } from '@/features/partner/components/laundry-trust-score-card';
import { PartnerActionCenter } from '@/features/partner/components/partner-action-center';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { buildAttentionItems } from '@/features/partner/lib/partner-derive';
import {
  usePartnerAnalytics,
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOperationsDashboard } from '@/services/operations';
import { useQuery } from '@tanstack/react-query';

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
  const kpisLoading = !queriesEnabled || analyticsQ.isPending;
  const opsLoading = !queriesEnabled || opsQ.isPending;
  const ordersLoading = !queriesEnabled || ordersQ.isPending;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Today at a glance"
        description={stats?.laundry_name}
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/operations">Operations center</Link>
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
          label="Today's pickups"
          value={ops ? String(ops.todays_pickups) : '—'}
          hint="Scheduled for today"
          icon={MapPin}
          loading={opsLoading}
        />
        <PartnerKpiCard
          label="Today's deliveries"
          value={ops ? String(ops.todays_deliveries) : '—'}
          hint="Due today"
          icon={Truck}
          loading={opsLoading}
        />
        <PartnerKpiCard
          label="Delayed orders"
          value={ops ? String(ops.delayed_orders) : '—'}
          hint="Past pickup/delivery window"
          icon={AlertTriangle}
          loading={opsLoading}
          accent={ops && ops.delayed_orders > 0 ? 'warning' : 'default'}
        />
        <PartnerKpiCard
          label="Pending assignments"
          value={ops ? String(ops.pending_tasks) : '—'}
          hint="Need driver assignment"
          icon={ClipboardList}
          loading={opsLoading}
          accent="warning"
        />
        <PartnerKpiCard
          label="Active drivers"
          value={ops ? String(ops.active_drivers ?? ops.assigned_drivers) : '—'}
          hint="On active tasks"
          icon={UserCheck}
          loading={opsLoading}
        />
        <PartnerKpiCard
          label="Today's revenue"
          value={stats ? formatInr(Number(stats.revenue_today_inr)) : '—'}
          hint="Delivered today"
          icon={IndianRupee}
          loading={kpisLoading}
          accent="success"
        />
        <PartnerKpiCard
          label="Today's orders"
          value={stats ? String(stats.orders_today) : '—'}
          hint="New bookings today"
          icon={Package}
          loading={kpisLoading}
        />
        <PartnerKpiCard
          label="Rating"
          value={stats ? `${stats.avg_rating} ★` : '—'}
          hint={stats ? `${stats.review_count} reviews` : undefined}
          icon={Star}
          loading={kpisLoading}
        />
      </PartnerKpiGrid>

      <LaundryTrustScoreCard />

      {ordersLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <PartnerActionCenter items={attention} />
      )}

      {ordersLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <PartnerOrdersTable orders={orders} filter="action" showSearch={false} />
      )}
    </PartnerContent>
  );
}
