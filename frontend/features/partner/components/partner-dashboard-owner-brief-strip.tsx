'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { OwnerBriefItem } from '@/features/partner/components/owner';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import { usePartnerBookingRequestsBadge } from '@/features/partner/booking-requests/hooks';
import { partnerBookingRequestsBadgeCount } from '@/features/partner/booking-requests/lib/partner-booking-status';
import { buildOwnerBriefItems } from '@/features/partner/lib/owner-brief';
import {
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOperationsDashboard } from '@/services/operations';

const BRIEF_IDS = new Set(['booking-requests', 'delayed']);

/**
 * Booking requests + delayed orders only — avoids duplicating Quick Overview KPIs.
 */
export function PartnerDashboardOwnerBriefStrip() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();

  const ordersQ = usePartnerOrders({
    page: 1,
    page_size: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const bookingBadgeQ = usePartnerBookingRequestsBadge();
  const opsQ = useQuery({
    queryKey: queryKeys.partnerOperationsDashboard(),
    queryFn: getOperationsDashboard,
    enabled: queriesEnabled,
    staleTime: STALE.adminDashboard,
  });

  const loading = !mounted || ordersQ.isLoading || opsQ.isLoading;
  const orders = mounted && queriesEnabled ? (ordersQ.data?.items ?? []) : [];
  const bookingRequestsCount = mounted
    ? partnerBookingRequestsBadgeCount({
        assignedTotal: bookingBadgeQ.data?.total,
        inbox: bookingBadgeQ.data?.inbox,
      })
    : 0;

  const items = useMemo(
    () =>
      buildOwnerBriefItems({
        orders,
        bookingRequestsCount,
        delayedOrders: opsQ.data?.delayed_orders ?? 0,
      }).filter((item) => BRIEF_IDS.has(item.id)),
    [orders, bookingRequestsCount, opsQ.data?.delayed_orders],
  );

  if (loading) {
    return <Skeleton className="h-16 w-full rounded-xl" aria-hidden />;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <PartnerOpsSurface
      className="space-y-2"
      aria-label="Needs attention"
      data-testid="partner-dashboard-owner-brief"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Needs attention
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
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
    </PartnerOpsSurface>
  );
}
