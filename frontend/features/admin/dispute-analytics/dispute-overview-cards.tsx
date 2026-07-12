'use client';

import { AlertTriangle, CheckCircle2, Clock, IndianRupee, Percent, TrendingUp } from 'lucide-react';

import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import type { DisputeAnalyticsOverview } from '@/services/dispute-analytics';

type Props = {
  overview: DisputeAnalyticsOverview | undefined;
  loading?: boolean;
};

export function DisputeOverviewCards({ overview, loading }: Props) {
  return (
    <KpiGrid className="lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Open disputes"
        value={overview ? formatCount(overview.open_disputes) : '—'}
        status={overview && overview.open_disputes > 0 ? 'warning' : 'healthy'}
        icon={AlertTriangle}
        loading={loading}
      />
      <KpiCard
        label="Resolved disputes"
        value={overview ? formatCount(overview.resolved_disputes) : '—'}
        change={overview ? { value: overview.period_label, positive: true } : undefined}
        status="healthy"
        icon={CheckCircle2}
        loading={loading}
      />
      <KpiCard
        label="Avg resolution time"
        value={overview ? `${overview.avg_resolution_hours}h` : '—'}
        status="neutral"
        icon={Clock}
        loading={loading}
      />
      <KpiCard
        label="Dispute rate"
        value={overview ? `${overview.dispute_rate_pct}%` : '—'}
        change={
          overview
            ? {
                value: `${formatCount(overview.total_disputes_period)} / ${formatCount(overview.total_orders_period)} orders`,
                positive: Number(overview.dispute_rate_pct) < 5,
              }
            : undefined
        }
        status={overview && Number(overview.dispute_rate_pct) >= 5 ? 'warning' : 'neutral'}
        icon={Percent}
        loading={loading}
      />
      <KpiCard
        label="Refund amount"
        value={overview ? formatInrCompact(Number(overview.refund_amount_inr)) : '—'}
        status="neutral"
        icon={IndianRupee}
        loading={loading}
      />
      <KpiCard
        label="Disputes (period)"
        value={overview ? formatCount(overview.total_disputes_period) : '—'}
        status="neutral"
        icon={TrendingUp}
        loading={loading}
      />
    </KpiGrid>
  );
}
