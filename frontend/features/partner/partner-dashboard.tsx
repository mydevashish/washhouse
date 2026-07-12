'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { IndianRupee, Package, Star, Truck } from 'lucide-react';

import { PartnerCustomersPanel } from '@/features/partner/partner-customers-panel';
import { PartnerOrdersPanel } from '@/features/partner/partner-orders-panel';
import { PartnerRevenuePanel } from '@/features/partner/partner-revenue-panel';
import { PartnerTabNav, type PartnerTab } from '@/features/partner/partner-tab-nav';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerAnalytics } from '@/services/partner';
import { Skeleton } from '@/components/ui/skeleton';

export function PartnerDashboard() {
  const [tab, setTab] = useState<PartnerTab>('orders');

  const analyticsQ = useQuery({
    queryKey: queryKeys.partnerAnalytics(),
    queryFn: getPartnerAnalytics,
    staleTime: STALE.partnerAnalytics,
  });

  const stats = analyticsQ.data;
  const pendingBadge = stats?.orders_pending;

  const franchiseCards = stats
    ? [
        {
          label: "Today's focus",
          value: String(stats.orders_pending),
          sub: 'Orders need action',
          icon: Package,
          accent: 'from-warning-muted to-background',
        },
        {
          label: 'In progress',
          value: String(stats.orders_in_progress),
          sub: 'Being processed',
          icon: Truck,
          accent: 'from-sky-500/20 to-sky-500/5',
        },
        {
          label: 'Revenue',
          value: formatInr(Number(stats.revenue_inr)),
          sub: 'Delivered orders',
          icon: IndianRupee,
          accent: 'from-success-muted to-background',
        },
        {
          label: 'Customers',
          value: String(stats.customers_count),
          sub: 'Total served',
          icon: Star,
          accent: 'from-primary/20 to-primary/5',
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <header className="rounded-xl bg-hero-gradient p-4 text-on-hero shadow-pop sm:p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-on-hero-muted">
          Franchise partner
        </p>
        <h1 className="page-title mt-2 text-on-hero">Your laundry dashboard</h1>
        <p className="mt-1.5 text-sm text-on-hero-muted">
          Accept orders, update status, and grow your business — all in a few taps.
        </p>
      </header>

      {analyticsQ.isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {franchiseCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {franchiseCards.map(({ label, value, sub, icon: Icon, accent }) => (
            <div
              key={label}
              className={`rounded-2xl border border-border bg-gradient-to-br ${accent} p-4 shadow-soft`}
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <PartnerTabNav active={tab} onChange={setTab} badges={{ orders: pendingBadge }} />

      {tab === 'orders' && <PartnerOrdersPanel />}
      {tab === 'customers' && <PartnerCustomersPanel />}
      {tab === 'revenue' && (
        <PartnerRevenuePanel
          stats={analyticsQ.data}
          isLoading={analyticsQ.isLoading}
          isError={analyticsQ.isError}
        />
      )}
    </div>
  );
}
