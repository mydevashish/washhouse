'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { LaundryTrustScoreCard } from '@/features/partner/components/laundry-trust-score-card';
import { PartnerActionCenter } from '@/features/partner/components/partner-action-center';
import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerRecentOrdersTable } from '@/features/partner/components/partner-recent-orders-table';
import {
  PartnerOpsHero,
  PartnerOpsKpiGrid,
  PartnerOpsStatusBars,
  PartnerOpsSurface,
  PartnerOpsTrendStrip,
} from '@/features/partner/components/ops-visual';
import {
  OWNER_IMAGES,
  OWNER_PILLARS,
  OwnerBriefItem,
  OwnerEmptyState,
  OwnerFloorStrip,
  OwnerMoneyPulse,
  OwnerPillarCard,
  OwnerSectionHeader,
} from '@/features/partner/components/owner';
import {
  OwnerMotionBlock,
  OwnerPillarMotionGrid,
  OwnerPillarMotionItem,
} from '@/features/partner/components/owner/owner-home-motion';
import { usePartnerBookingRequestsBadge } from '@/features/partner/booking-requests/hooks';
import { partnerBookingRequestsBadgeCount } from '@/features/partner/booking-requests/lib/partner-booking-status';
import { buildAttentionItems } from '@/features/partner/lib/partner-derive';
import { buildOwnerBriefItems } from '@/features/partner/lib/owner-brief';
import {
  usePartnerAnalytics,
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerCustomerInsightsDashboard } from '@/services/customer-insights';
import { getOperationsDashboard } from '@/services/operations';
import { cn } from '@/lib/utils';

function formatCount(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—';
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

export function PartnerOverviewView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const analyticsQ = usePartnerAnalytics();
  const ordersQ = usePartnerOrders({ page: 1, page_size: 10 });
  const actionQ = usePartnerOrders({ page: 1, page_size: 1, bucket: 'action' });
  const unpaidQ = usePartnerOrders({ page: 1, page_size: 1, payment_status: 'unpaid' });
  const bookingBadgeQ = usePartnerBookingRequestsBadge();
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

  const stats = mounted && queriesEnabled ? analyticsQ.data : undefined;
  const ops = mounted && queriesEnabled ? opsQ.data : undefined;
  const orders = mounted && queriesEnabled ? (ordersQ.data?.items ?? []) : [];
  const attention = buildAttentionItems(
    orders,
    mounted && queriesEnabled ? Date.now() : undefined,
  );

  const kpisLoading = analyticsQ.isLoading;
  const opsLoading = opsQ.isLoading;
  const ordersLoading = ordersQ.isLoading;
  const unpaidLoading = unpaidQ.isLoading;
  const insightsLoading = insightsQ.isLoading;
  const briefLoading = ordersLoading || opsLoading || bookingBadgeQ.isLoading;

  const needsAction = actionQ.data?.total_records ?? 0;
  const inShop = Math.max(
    0,
    (stats?.orders_in_progress ?? 0) - (stats?.orders_ready ?? 0),
  );
  const inProcess = inShop;
  const readyCount = stats?.orders_ready ?? 0;
  const pendingPickup = stats?.orders_pending ?? 0;
  const deliveredToday = ops?.completed_orders_today ?? 0;
  const pickupCount = ops?.todays_pickups ?? stats?.pickup_requests ?? 0;
  const deliveryCount = ops?.todays_deliveries ?? 0;

  const bookingRequestsCount = mounted
    ? partnerBookingRequestsBadgeCount({
        assignedTotal: bookingBadgeQ.data?.total,
        inbox: bookingBadgeQ.data?.inbox,
      })
    : 0;

  const briefItems = useMemo(
    () =>
      buildOwnerBriefItems({
        orders,
        bookingRequestsCount,
        delayedOrders: ops?.delayed_orders ?? 0,
      }),
    [orders, bookingRequestsCount, ops?.delayed_orders],
  );

  const laundryName = stats?.laundry_name ?? 'Your laundry';
  const hour = mounted ? new Date().getHours() : 12;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const revenueToday = stats?.revenue_today_inr;
  const revenueTodayNum =
    revenueToday != null && revenueToday !== '' && Number.isFinite(Number(revenueToday))
      ? Number(revenueToday)
      : null;

  const newThisWeek = insightsQ.data?.new_this_week;
  const unpaidCount = unpaidQ.data?.total_records;

  const weekInr = stats ? Number(stats.revenue_week_inr) : 0;
  const prevWeekInr = stats ? Number(stats.revenue_prev_week_inr) : 0;
  const trendPoints =
    !kpisLoading && (weekInr > 0 || prevWeekInr > 0)
      ? [
          { label: 'Last', value: Math.max(0, prevWeekInr) },
          { label: 'This', value: Math.max(0, weekInr) },
        ]
      : [];

  const statusLoading = kpisLoading || opsLoading;
  const kpiGridLoading = kpisLoading || unpaidLoading || insightsLoading;

  const heroBadge =
    needsAction > 0 || bookingRequestsCount > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        {needsAction > 0 ? (
          <Link
            href="/partner/orders?chip=needs_action"
            className={cn(badgeVariants({ variant: 'warning' }), 'hover:opacity-90')}
          >
            {needsAction} need action
          </Link>
        ) : null}
        {bookingRequestsCount > 0 ? (
          <Link
            href={buildOrdersHubPath('/partner/orders', 'requests')}
            className={cn(badgeVariants({ variant: 'secondary' }), 'hover:opacity-90')}
          >
            {bookingRequestsCount} requests
          </Link>
        ) : null}
      </div>
    ) : undefined;

  const kpiItems = [
    {
      label: 'Orders today',
      value: formatCount(stats?.orders_today, kpisLoading),
    },
    {
      label: 'Delivered today (gross)',
      value: kpisLoading
        ? '—'
        : revenueTodayNum != null
          ? formatInr(revenueTodayNum)
          : '—',
      delta: !kpisLoading
        ? {
            label: 'Delivered orders · UTC day window',
            tone: 'muted' as const,
          }
        : undefined,
    },
    {
      label: 'Unpaid orders',
      value: formatCount(unpaidCount, unpaidLoading),
      href: '/partner/orders?chip=unpaid',
    },
    {
      label: 'New this week',
      value: insightsLoading ? '—' : newThisWeek != null ? String(newThisWeek) : '—',
      href: buildOrdersHubPath('/partner/orders', 'directory'),
      delta:
        !insightsLoading && !insightsQ.isError && newThisWeek == null
          ? { label: 'Count not returned — open Customers', tone: 'muted' as const }
          : undefined,
    },
  ];

  const createOrderHref = buildOrdersHubPath('/partner/orders', 'create');

  return (
    <PartnerContent className="space-y-6 pb-10">
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
      {unpaidQ.isError && (
        <QueryErrorState
          title="Could not load unpaid count"
          message={getApiErrorMessage(unpaidQ.error, 'Unpaid orders count failed to load')}
          onRetry={() => void unpaidQ.refetch()}
          isRetrying={unpaidQ.isFetching}
        />
      )}
      {insightsQ.isError && (
        <QueryErrorState
          title="Could not load customer insights"
          message={getApiErrorMessage(insightsQ.error, 'New customer metrics failed to load')}
          onRetry={() => void insightsQ.refetch()}
          isRetrying={insightsQ.isFetching}
        />
      )}

      <OwnerMotionBlock>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Laundry dashboard
            </p>
            <h1 className="page-title mt-1 truncate">
              {greeting}
              {mounted ? `, ${laundryName}` : ''}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Glance KPIs and today&apos;s queue, then open Customers &amp; Orders to create walk-ins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" asChild>
              <Link href={createOrderHref}>New order</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Find customer</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/logistics">Open logistics</Link>
            </Button>
          </div>
        </header>
      </OwnerMotionBlock>

      {/* Order-demo first viewport: hero + KPI | status + trend (real data) */}
      <section
        className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]"
        aria-label="Operations overview"
      >
        <PartnerOpsSurface className="space-y-4">
          <PartnerOpsHero
            eyebrow="Featured service"
            title="Create a new laundry order quickly"
            hint="Search customer, add services, and print tags."
            description="Add wash, iron and dry clean from your catalog — counter intake lives under Customers & Orders."
            imageSrc="/marketing/heroes/services.webp"
            imageAlt="Laundry services"
            badge={heroBadge}
            actions={
              <Button type="button" size="sm" asChild>
                <Link href={createOrderHref}>Create order</Link>
              </Button>
            }
          />
          <PartnerOpsKpiGrid
            items={kpiItems}
            loading={kpiGridLoading}
            error={
              analyticsQ.isError ? 'Analytics unavailable — counts may be incomplete.' : undefined
            }
            onRetry={analyticsQ.isError ? () => void analyticsQ.refetch() : undefined}
          />
        </PartnerOpsSurface>

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
                rows={[
                  { label: 'Awaiting pickup', value: pendingPickup, colorToken: 'primary' },
                  { label: 'In shop', value: inShop, colorToken: 'secondary' },
                  { label: 'Ready', value: readyCount, colorToken: 'success' },
                  { label: 'Delivered today', value: deliveredToday, colorToken: 'muted' },
                ]}
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
              alt="On-time delivery"
              width={640}
              height={420}
              className="h-full w-full object-cover"
              sizes="(min-width: 1280px) 22vw, 100vw"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
        <OwnerMotionBlock delay={0.05} className="min-h-0">
          <section
            className="flex h-full flex-col rounded-xl bg-card p-4 ring-1 ring-border/60 sm:p-5"
            aria-label="Do next"
          >
            <OwnerSectionHeader
              title="Do next"
              description="Up to five things that clear the morning fastest."
            />
            {briefLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : briefItems.length === 0 ? (
              <div className="mt-3 flex-1">
                <OwnerEmptyState
                  title="Floor is clear — nice work"
                  description="No urgent orders, pickups, or requests right now. New work will show up here."
                  imageSrc={OWNER_IMAGES.calm}
                  imageAlt="Calm laundry"
                  action={{ label: 'New order', href: createOrderHref }}
                  className="border-0 bg-transparent px-2 py-6"
                />
              </div>
            ) : (
              <ul className="mt-2 flex flex-1 flex-col gap-0.5">
                {briefItems.map((item) => (
                  <li key={item.id}>
                    <OwnerBriefItem
                      title={item.title}
                      reason={item.reason}
                      href={item.href}
                      count={item.count}
                      icon={item.icon}
                      imageSrc={item.imageSrc}
                      imageAlt={item.imageAlt}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </OwnerMotionBlock>

        <OwnerMotionBlock delay={0.1} className="min-h-0">
          <OwnerMoneyPulse stats={stats} loading={kpisLoading} className="h-full" />
        </OwnerMotionBlock>
      </div>

      <OwnerMotionBlock delay={0.12}>
        <OwnerSectionHeader
          title="Your pillars"
          description="Orders, logistics, people, money."
        />
        <OwnerPillarMotionGrid className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {OWNER_PILLARS.map((pillar, index) => (
            <OwnerPillarMotionItem key={pillar.id}>
              <OwnerPillarCard
                title={pillar.title}
                subtitle={pillar.subtitle}
                href={pillar.href}
                imageSrc={pillar.imageSrc}
                imageAlt={pillar.imageAlt}
                priority={index < 2}
                badgeCount={
                  pillar.id === 'orders'
                    ? needsAction || bookingRequestsCount || undefined
                    : pillar.id === 'logistics'
                      ? pickupCount + deliveryCount || undefined
                      : undefined
                }
              />
            </OwnerPillarMotionItem>
          ))}
        </OwnerPillarMotionGrid>
      </OwnerMotionBlock>

      <section className="space-y-3" aria-label="Today on the floor">
        <OwnerSectionHeader
          title="Today on the floor"
          description="Ready bags, work in process, and deliveries."
        />
        <OwnerFloorStrip
          ordersToday={stats?.orders_today ?? orders.length}
          inProcess={inProcess || stats?.orders_in_progress || 0}
          ready={readyCount}
          deliveries={deliveryCount}
          loading={kpisLoading || ordersLoading || opsLoading}
        />
      </section>

      {ordersLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : (
        <PartnerRecentOrdersTable orders={orders} limit={6} />
      )}

      <OwnerPillarCard
        title="Your shop"
        subtitle="Storefront, services, garment prices, and reviews"
        href="/partner/storefront"
        imageSrc={OWNER_IMAGES.shop}
        imageAlt="Wash and iron services"
        className="min-h-[6.5rem] sm:min-h-[7rem]"
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
