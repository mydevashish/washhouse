'use client';

import { IndianRupee, Package, Percent, TrendingUp } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { AdminDashboard } from '@/services/admin';

type AdminRevenuePanelProps = {
  data?: AdminDashboard;
  isLoading: boolean;
  isError: boolean;
};

export function AdminRevenuePanel({ data, isLoading, isError }: AdminRevenuePanelProps) {
  if (isError || (!isLoading && !data)) {
    return (
      <InfoBanner variant="destructive" title="Could not load revenue data">
        Refresh to try again.
      </InfoBanner>
    );
  }

  return (
    <div className="space-y-4">
      <KpiGrid className="sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
        <KpiCard
          label="Lifetime GMV"
          value={data ? formatInr(Number(data.revenue_total_inr)) : '—'}
          change={{ value: 'Delivered orders', positive: true }}
          icon={IndianRupee}
          status="healthy"
          loading={isLoading}
        />
        <KpiCard
          label="Revenue (MTD)"
          value={data ? formatInrCompact(Number(data.revenue_month_inr)) : '—'}
          change={{ value: 'This month', positive: true }}
          icon={TrendingUp}
          status="healthy"
          loading={isLoading}
        />
        <KpiCard
          label="Commission (MTD)"
          value={data ? formatInrCompact(Number(data.commission_month_inr)) : '—'}
          change={{ value: 'Platform share', positive: true }}
          icon={Percent}
          status="neutral"
          loading={isLoading}
        />
        <KpiCard
          label="Total orders"
          value={data ? formatCount(data.orders_total) : '—'}
          change={
            data && data.orders_in_progress > 0
              ? { value: `${data.orders_in_progress} in progress`, positive: true }
              : undefined
          }
          icon={Package}
          status="neutral"
          loading={isLoading}
        />
      </KpiGrid>
    </div>
  );
}
