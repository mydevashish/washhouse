'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { IndianRupee, TrendingUp } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerAnalytics, usePartnerOrders } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';

const PartnerRevenueChart = dynamic(
  () =>
    import('@/features/partner/components/partner-revenue-chart').then((m) => m.PartnerRevenueChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

export function PartnerRevenueView() {
  const analyticsQ = usePartnerAnalytics();
  const ordersQ = usePartnerOrders();
  const stats = analyticsQ.data;

  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of ordersQ.data ?? []) {
      if (o.status !== 'delivered') continue;
      for (const item of o.items ?? []) {
        const key = item.service_name;
        map.set(key, (map.get(key) ?? 0) + Number(item.line_total_inr ?? 0));
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [ordersQ.data]);

  const chartData = useMemo(
    () => [
      { label: 'Today', revenue: Number(stats?.revenue_today_inr ?? 0) },
      { label: 'This week', revenue: Number(stats?.revenue_week_inr ?? 0) },
      { label: 'This month', revenue: Number(stats?.revenue_this_month_inr ?? 0) },
      { label: 'All time', revenue: Number(stats?.revenue_inr ?? 0) },
    ],
    [stats],
  );

  const avgOrder =
    stats && stats.orders_delivered > 0
      ? Number(stats.revenue_inr) / stats.orders_delivered
      : 0;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title="Revenue" description="Earnings from delivered orders." />

      <PartnerKpiGrid className="sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
        <PartnerKpiCard
          label="Today"
          value={stats ? formatInr(Number(stats.revenue_today_inr)) : '—'}
          icon={IndianRupee}
          loading={analyticsQ.isLoading}
        />
        <PartnerKpiCard
          label="This week"
          value={stats ? formatInr(Number(stats.revenue_week_inr)) : '—'}
          icon={TrendingUp}
          loading={analyticsQ.isLoading}
        />
        <PartnerKpiCard
          label="This month"
          value={stats ? formatInr(Number(stats.revenue_this_month_inr)) : '—'}
          icon={TrendingUp}
          loading={analyticsQ.isLoading}
        />
        <PartnerKpiCard
          label="Avg. order value"
          value={stats ? formatInr(avgOrder) : '—'}
          hint={`${stats?.orders_delivered ?? 0} delivered`}
          icon={IndianRupee}
          loading={analyticsQ.isLoading}
        />
      </PartnerKpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartnerPanel title="Revenue snapshot" bodyClassName="p-4">
          {analyticsQ.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <PartnerRevenueChart data={chartData} />
          )}
        </PartnerPanel>

        <PartnerPanel title="Top services" bodyClassName="p-0">
          {serviceBreakdown.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No delivered orders yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {serviceBreakdown.map((s) => (
                <li key={s.name} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-sm tabular-nums">{formatInr(s.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </PartnerPanel>
      </div>
    </PartnerContent>
  );
}
