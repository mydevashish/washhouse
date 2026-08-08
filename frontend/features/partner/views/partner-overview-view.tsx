'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { LaundryTrustScoreCard } from '@/features/partner/components/laundry-trust-score-card';
import { PartnerActionCenter } from '@/features/partner/components/partner-action-center';
import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerRecentOrdersTable } from '@/features/partner/components/partner-recent-orders-table';
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
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOperationsDashboard } from '@/services/operations';

export function PartnerOverviewView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const analyticsQ = usePartnerAnalytics();
  const ordersQ = usePartnerOrders({ page: 1, page_size: 10 });
  const actionQ = usePartnerOrders({ page: 1, page_size: 10, bucket: 'action' });
  const bookingBadgeQ = usePartnerBookingRequestsBadge();
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
  const briefLoading = ordersLoading || opsLoading || bookingBadgeQ.isLoading;

  const needsAction = actionQ.data?.total_records ?? 0;
  const inProcess = Math.max(
    0,
    (stats?.orders_in_progress ?? 0) - (stats?.orders_ready ?? 0),
  );
  const readyCount = stats?.orders_ready ?? 0;
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

  return (
    <PartnerContent className="space-y-6">
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

      {/* First viewport — one composition: greeting → brief + money → pillars */}
      <OwnerMotionBlock>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Owner command center
            </p>
            <h1 className="page-title mt-1 truncate">
              {greeting}
              {mounted ? `, ${laundryName}` : ''}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              See what needs you next, check today&apos;s money, then jump into a pillar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" asChild>
              <Link href="/partner/new-order">New Order</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/orders?tab=desk">Find customer</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/logistics">Open logistics</Link>
            </Button>
          </div>
        </header>
      </OwnerMotionBlock>

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
                  action={{ label: 'New Order', href: '/partner/new-order' }}
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
          description="Picture-first shortcuts — Orders, Logistics, People, Money."
        />
        <OwnerPillarMotionGrid className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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

      {/* Below fold */}
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
