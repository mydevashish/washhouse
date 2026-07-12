'use client';

import { IndianRupee, Package, Percent, Store, TrendingUp, Trophy } from 'lucide-react';

import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import type { RevenueOverview } from '@/services/revenue-analytics';

type Props = {
  overview: RevenueOverview | undefined;
  loading?: boolean;
  onTopLaundryClick?: () => void;
};

export function RevenueOverviewCards({ overview, loading, onTopLaundryClick }: Props) {
  return (
    <KpiGrid className="lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Platform revenue"
        value={overview ? formatInrCompact(Number(overview.total_platform_revenue_inr)) : '—'}
        change={overview ? { value: overview.period_label, positive: true } : undefined}
        status="healthy"
        icon={IndianRupee}
        loading={loading}
      />
      <KpiCard
        label="Commission revenue"
        value={overview ? formatInrCompact(Number(overview.platform_commission_inr)) : '—'}
        status="neutral"
        icon={Percent}
        loading={loading}
      />
      <KpiCard
        label="Total orders"
        value={overview ? formatCount(overview.total_orders) : '—'}
        change={
          overview
            ? { value: `${formatCount(overview.delivered_orders)} delivered`, positive: true }
            : undefined
        }
        status="neutral"
        icon={Package}
        loading={loading}
      />
      <KpiCard
        label="Avg order value"
        value={overview ? formatInrCompact(Number(overview.average_order_value_inr)) : '—'}
        status="neutral"
        icon={TrendingUp}
        loading={loading}
      />
      <KpiCard
        label="Active laundries"
        value={overview ? formatCount(overview.active_laundries) : '—'}
        status="healthy"
        icon={Store}
        loading={loading}
      />
      <KpiCard
        label="Top laundry"
        value={
          overview?.top_laundry_name
            ? formatInrCompact(Number(overview.top_laundry_revenue_inr ?? 0))
            : '—'
        }
        change={
          overview?.top_laundry_name
            ? { value: overview.top_laundry_name, positive: true }
            : undefined
        }
        status="healthy"
        icon={Trophy}
        loading={loading}
        onClick={onTopLaundryClick}
      />
    </KpiGrid>
  );
}
