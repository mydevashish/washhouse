'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  PartnerOpsStatusBars,
  PartnerOpsTrendStrip,
  PartnerOrderDemoLiveComposer,
  PartnerOrderWorkspacePanels,
  computePartnerCheckoutTotals,
} from '@/features/partner/components/ops-visual';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerWalkInOrderComposer } from '@/features/partner/hooks/use-partner-walk-in-order-composer';
import {
  usePartnerAnalytics,
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { WalkInSuccessPanel } from '@/features/partner-shop-floor/components/walk-in-success-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerCustomerInsightsDashboard } from '@/services/customer-insights';
import { getOperationsDashboard } from '@/services/operations';

function formatCount(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—';
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

function formatMoney(value: number | null, loading: boolean): string {
  if (loading) return '—';
  if (value == null || !Number.isFinite(value)) return '—';
  return formatInr(value);
}

/** Demo-style status labels mapped to live lifecycle counts. */
function demoStatusRows(input: {
  pendingPickup: number;
  inShop: number;
  ready: number;
  deliveredToday: number;
}) {
  return [
    { label: 'New', value: input.pendingPickup, colorToken: 'primary' as const },
    { label: 'Processing', value: input.inShop, colorToken: 'secondary' as const },
    { label: 'Ready', value: input.ready, colorToken: 'success' as const },
    { label: 'Delivered', value: input.deliveredToday, colorToken: 'muted' as const },
  ];
}

export function PartnerLaundryDashboardView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const composer = usePartnerWalkInOrderComposer({
    lookupActive: true,
    lookupOnlyOnCustomerStep: false,
  });
  const successRef = useRef<HTMLDivElement>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [paymentMethod] = useState('Cash');

  const analyticsQ = usePartnerAnalytics();
  const unpaidQ = usePartnerOrders({ page: 1, page_size: 1, payment_status: 'unpaid' });
  const insightsQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled: queriesEnabled,
    staleTime: STALE.adminDashboard,
  });
  const opsQ = useQuery({
    queryKey: queryKeys.partnerOperationsDashboard(),
    queryFn: getOperationsDashboard,
    enabled: queriesEnabled,
    staleTime: STALE.adminDashboard,
  });

  const kpisLoading = analyticsQ.isLoading;
  const opsLoading = opsQ.isLoading;
  const unpaidLoading = unpaidQ.isLoading;
  const insightsLoading = insightsQ.isLoading;
  const statusLoading = kpisLoading || opsLoading;

  const stats = mounted && queriesEnabled ? analyticsQ.data : undefined;
  const ops = mounted && queriesEnabled ? opsQ.data : undefined;

  const revenueTodayNum =
    stats?.revenue_today_inr != null &&
    stats.revenue_today_inr !== '' &&
    Number.isFinite(Number(stats.revenue_today_inr))
      ? Number(stats.revenue_today_inr)
      : null;

  const unpaidCount = unpaidQ.data?.total_records;
  const newThisWeek = insightsQ.data?.new_this_week;

  const inShop = Math.max(0, (stats?.orders_in_progress ?? 0) - (stats?.orders_ready ?? 0));
  const readyCount = stats?.orders_ready ?? 0;
  const pendingPickup = stats?.orders_pending ?? 0;
  const deliveredToday = ops?.completed_orders_today ?? 0;

  const weekInr = stats ? Number(stats.revenue_week_inr) : 0;
  const prevWeekInr = stats ? Number(stats.revenue_prev_week_inr) : 0;
  const trendPoints =
    !kpisLoading && (weekInr > 0 || prevWeekInr > 0)
      ? [
          { label: 'Last', value: Math.max(0, prevWeekInr) },
          { label: 'This', value: Math.max(0, weekInr) },
        ]
      : [];

  const kpiCards = [
    {
      label: 'Total Orders',
      title: 'Orders placed today',
      value: formatCount(stats?.orders_today, kpisLoading),
    },
    {
      label: "Today's Sales",
      title: 'Gross revenue delivered today (UTC day)',
      value: formatMoney(revenueTodayNum, kpisLoading),
    },
    {
      label: 'Pending Payments',
      title: 'Unpaid order count — open Orders for amounts',
      value: formatCount(unpaidCount, unpaidLoading),
    },
    {
      label: 'New Customers',
      title: 'New customers this week',
      value: insightsLoading ? '—' : newThisWeek != null ? String(newThisWeek) : '—',
    },
  ];

  const kpiGridLoading = kpisLoading || unpaidLoading || insightsLoading;

  const draftTotals = useMemo(
    () =>
      computePartnerCheckoutTotals({
        subtotal: composer.estimatedSubtotal,
        couponApplied: false,
        deliveryType: 'Both',
        lineCount: composer.lineRows.length,
        itemQty: composer.pieceCount,
      }),
    [composer.estimatedSubtotal, composer.lineRows.length, composer.pieceCount],
  );

  useEffect(() => {
    if (composer.createdOrder) {
      setShowSuccessBanner(true);
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [composer.createdOrder]);

  const order = composer.createdOrder;
  const estimatedGrandTotal = order ? Number(order.total_inr) : draftTotals.grandTotal;

  return (
    <PartnerContent className="space-y-5">
      {analyticsQ.isError ? (
        <QueryErrorState
          title="Could not load analytics"
          message={getApiErrorMessage(analyticsQ.error, 'Dashboard metrics failed to load')}
          onRetry={() => void analyticsQ.refetch()}
          isRetrying={analyticsQ.isFetching}
        />
      ) : null}
      {opsQ.isError ? (
        <QueryErrorState
          title="Could not load operations summary"
          message={getApiErrorMessage(opsQ.error, 'Operations summary failed to load')}
          onRetry={() => void opsQ.refetch()}
          isRetrying={opsQ.isFetching}
        />
      ) : null}

      <div className="space-y-5">
        <PartnerPageHeader
          title="New Order / Laundry Dashboard"
          description="Search customer, add services, print tags, invoice preview, and delivery dispatch."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/partner/orders">Orders</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Customers</Link>
              </Button>
            </div>
          }
        />

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]" aria-label="Operations overview">
          <div className="space-y-4 rounded-[32px] border border-border bg-background p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="success">Live data</Badge>
                  <p className="text-sm text-muted-foreground">
                    Search customer, add services, and print tags.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">
                    Featured service
                  </p>
                  <h2 className="text-2xl font-semibold">Create a new laundry order quickly</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Add wash, iron and dry clean services with category selection and quantity entry.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-muted/30">
                <Image
                  src="/marketing/heroes/services.webp"
                  alt="Laundry services photo"
                  width={640}
                  height={420}
                  className="h-full w-full object-cover"
                  sizes="(min-width: 1280px) 40vw, 100vw"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpiGridLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[5.5rem] rounded-3xl" />
                  ))
                : kpiCards.map((summary) => (
                    <div
                      key={summary.label}
                      className="rounded-3xl bg-muted p-4"
                      title={summary.title}
                    >
                      <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">
                        {summary.label}
                      </p>
                      <p className="mt-3 text-xl font-semibold tabular-nums">{summary.value}</p>
                    </div>
                  ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Order status overview</CardTitle>
                <CardDescription>
                  Today&apos;s order progress across pickup, processing and delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PartnerOpsStatusBars
                  loading={statusLoading}
                  rows={demoStatusRows({
                    pendingPickup,
                    inShop,
                    ready: readyCount,
                    deliveredToday,
                  })}
                />
                <PartnerOpsTrendStrip
                  title="Sales trend"
                  data={trendPoints}
                  emptyHref="/partner/revenue"
                />
              </CardContent>
            </Card>
            <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
              <Image
                src="/marketing/heroes/delivery.webp"
                alt="Delivery photo"
                width={640}
                height={420}
                className="h-full w-full object-cover"
                sizes="(min-width: 1280px) 22vw, 100vw"
              />
            </div>
          </div>
        </section>

        {order ? (
          <WalkInSuccessPanel
            order={order}
            onStartWash={() => composer.startWashMutation.mutate(order.id)}
            startWashPending={composer.startWashMutation.isPending}
          />
        ) : (
          <PartnerOrderDemoLiveComposer composer={composer} />
        )}

        {showSuccessBanner && order ? (
          <div
            ref={successRef}
            className="rounded-3xl border border-primary/20 bg-primary/10 p-4 text-primary"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Order created successfully</p>
                <p className="text-sm text-primary/80">
                  Order #{order.tracking_code} is saved — print tags and invoice below.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    composer.resetWorkspace();
                    setShowSuccessBanner(false);
                  }}
                >
                  Create another order
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <PartnerOrderWorkspacePanels
          order={order}
          customer={composer.customerPanel}
          lineRows={composer.lineRows}
          paymentMethod={paymentMethod}
          deliveryType="Walk-in counter"
          estimatedGrandTotal={estimatedGrandTotal}
          onCreateAnother={
            order
              ? () => {
                  composer.resetWorkspace();
                  setShowSuccessBanner(false);
                }
              : undefined
          }
        />
      </div>
    </PartnerContent>
  );
}
