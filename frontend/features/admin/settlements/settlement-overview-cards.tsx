'use client';

import { CheckCircle2, Clock, IndianRupee, Percent, Wallet } from 'lucide-react';

import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import type { SettlementDashboard } from '@/services/settlements';

type Props = { dashboard: SettlementDashboard | undefined; loading?: boolean };

export function SettlementOverviewCards({ dashboard, loading }: Props) {
  return (
    <KpiGrid className="lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Pending settlements"
        value={dashboard ? formatInrCompact(Number(dashboard.total_pending_settlements_inr)) : '—'}
        change={dashboard ? { value: `${formatCount(dashboard.pending_count)} batches`, positive: false } : undefined}
        status="warning"
        icon={Clock}
        loading={loading}
      />
      <KpiCard
        label="Paid settlements"
        value={dashboard ? formatInrCompact(Number(dashboard.total_paid_settlements_inr)) : '—'}
        change={dashboard ? { value: `${formatCount(dashboard.paid_count)} batches`, positive: true } : undefined}
        status="healthy"
        icon={CheckCircle2}
        loading={loading}
      />
      <KpiCard
        label="Today's payouts"
        value={dashboard ? formatInrCompact(Number(dashboard.today_payouts_inr)) : '—'}
        status="neutral"
        icon={Wallet}
        loading={loading}
      />
      <KpiCard
        label="Monthly payouts"
        value={dashboard ? formatInrCompact(Number(dashboard.monthly_payouts_inr)) : '—'}
        status="neutral"
        icon={IndianRupee}
        loading={loading}
      />
      <KpiCard
        label="Partner earnings"
        value={dashboard ? formatInrCompact(Number(dashboard.partner_earnings_inr)) : '—'}
        status="healthy"
        icon={Wallet}
        loading={loading}
      />
      <KpiCard
        label="Platform commission"
        value={dashboard ? formatInrCompact(Number(dashboard.platform_commission_inr)) : '—'}
        status="neutral"
        icon={Percent}
        loading={loading}
      />
    </KpiGrid>
  );
}
