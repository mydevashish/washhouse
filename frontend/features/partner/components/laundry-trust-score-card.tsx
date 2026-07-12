'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { LaundryTrustScoreBadge } from '@/features/admin/components/laundry-trust-score-badge';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { queryKeys } from '@/lib/query-keys';
import { getPartnerTrustScore } from '@/services/laundry-trust-score';

const METRIC_LABELS = [
  { label: 'On-time delivery', key: 'on_time' as const },
  { label: 'Complaint rate', key: 'complaint' as const },
  { label: 'Refund rate', key: 'refund' as const },
  { label: 'Dispute rate', key: 'dispute' as const },
  { label: 'Customer rating', key: 'rating' as const },
  { label: 'Completed orders', key: 'orders' as const },
];

function metricRows(metrics: {
  on_time_delivery_pct: number;
  complaint_rate_pct: number;
  refund_rate_pct: number;
  dispute_rate_pct: number;
  avg_rating: number;
  completed_orders: number;
}) {
  return [
    { key: 'on_time', value: `${metrics.on_time_delivery_pct}%` },
    { key: 'complaint', value: `${metrics.complaint_rate_pct}%` },
    { key: 'refund', value: `${metrics.refund_rate_pct}%` },
    { key: 'dispute', value: `${metrics.dispute_rate_pct}%` },
    { key: 'rating', value: `${metrics.avg_rating} ★` },
    { key: 'orders', value: String(metrics.completed_orders) },
  ];
}

export function LaundryTrustScoreCard() {
  const enabled = usePartnerQueriesEnabled();
  const trustQ = useQuery({
    queryKey: queryKeys.partnerTrustScore(),
    queryFn: getPartnerTrustScore,
    enabled,
    staleTime: 60_000,
  });

  if (!enabled || trustQ.isPending) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (trustQ.isError || !trustQ.data) {
    return (
      <InfoBanner variant="default" title="Trust score unavailable">
        Complete more deliveries to build your Laundry Trust Score.
      </InfoBanner>
    );
  }

  const d = trustQ.data;
  const rows = metricRows(d.metrics);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">Laundry Trust Score</h2>
            <p className="text-xs text-muted-foreground">
              Based on delivery performance, disputes, ratings, and order volume
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">{d.trust_score}</p>
          <LaundryTrustScoreBadge level={d.level} className="mt-1" />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRIC_LABELS.map((meta, i) => {
          const row = rows[i];
          return (
            <div key={meta.key} className="rounded-xl bg-muted/40 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{meta.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">{row?.value ?? '—'}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
