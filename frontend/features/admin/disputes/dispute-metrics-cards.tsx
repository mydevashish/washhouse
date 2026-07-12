'use client';

import {
  AlertTriangle,
  Clock,
  Flame,
  Inbox,
  Search,
  ShieldAlert,
  Timer,
  TrendingDown,
  UserCheck,
} from 'lucide-react';

import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount } from '@/features/admin/lib/format-admin';
import type { DisputeAdminMetrics } from '@/services/disputes';

type Props = {
  metrics: DisputeAdminMetrics | undefined;
  loading?: boolean;
  onMyOpenClick?: () => void;
  onUnassignedClick?: () => void;
  onNearSlaBreachClick?: () => void;
  onBreachedSlaClick?: () => void;
};

export function DisputeMetricsCards({
  metrics,
  loading,
  onMyOpenClick,
  onUnassignedClick,
  onNearSlaBreachClick,
  onBreachedSlaClick,
}: Props) {
  return (
    <KpiGrid className="lg:grid-cols-5 2xl:grid-cols-10">
      <KpiCard
        label="Near SLA breach"
        value={metrics ? formatCount(metrics.near_sla_breach) : '—'}
        status="warning"
        icon={Timer}
        loading={loading}
        onClick={onNearSlaBreachClick}
      />
      <KpiCard
        label="Breached disputes"
        value={metrics ? formatCount(metrics.breached_sla) : '—'}
        status="critical"
        icon={AlertTriangle}
        loading={loading}
        onClick={onBreachedSlaClick}
      />
      <KpiCard
        label="My open disputes"
        value={metrics ? formatCount(metrics.my_open_disputes) : '—'}
        status="warning"
        icon={UserCheck}
        loading={loading}
        onClick={onMyOpenClick}
      />
      <KpiCard
        label="Unassigned disputes"
        value={metrics ? formatCount(metrics.unassigned_disputes) : '—'}
        status="critical"
        icon={Inbox}
        loading={loading}
        onClick={onUnassignedClick}
      />
      <KpiCard
        label="Open disputes"
        value={metrics ? formatCount(metrics.open_disputes) : '—'}
        status="warning"
        icon={AlertTriangle}
        loading={loading}
      />
      <KpiCard
        label="Critical"
        value={metrics ? formatCount(metrics.critical_disputes) : '—'}
        status="critical"
        icon={Flame}
        loading={loading}
      />
      <KpiCard
        label="Resolved today"
        value={metrics ? formatCount(metrics.resolved_today) : '—'}
        status="healthy"
        icon={ShieldAlert}
        loading={loading}
      />
      <KpiCard
        label="Avg resolution"
        value={metrics ? `${metrics.avg_resolution_hours}h` : '—'}
        status="neutral"
        icon={Clock}
        loading={loading}
      />
      <KpiCard
        label="Dispute rate"
        value={metrics ? `${metrics.dispute_rate_pct}%` : '—'}
        status="neutral"
        icon={TrendingDown}
        loading={loading}
      />
      <KpiCard
        label="Pending investigation"
        value={metrics ? formatCount(metrics.pending_investigation) : '—'}
        status="warning"
        icon={Search}
        loading={loading}
      />
    </KpiGrid>
  );
}
