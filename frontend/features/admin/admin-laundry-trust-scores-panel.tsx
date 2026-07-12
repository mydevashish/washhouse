'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, Store } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { LaundryTrustScoreBadge } from '@/features/admin/components/laundry-trust-score-badge';
import { queryKeys } from '@/lib/query-keys';
import {
  getAdminLaundryTrustScoreDetail,
  listAdminLaundryTrustScores,
  type LaundryTrustScoreSummary,
} from '@/services/laundry-trust-score';

const BREAKDOWN_LABELS: Record<string, string> = {
  on_time_delivery: 'On-time delivery',
  complaint_rate: 'Complaint rate (inverted)',
  refund_rate: 'Refund rate (inverted)',
  dispute_rate: 'Dispute rate (inverted)',
  customer_rating: 'Customer rating',
  completed_orders: 'Order volume',
};

function LaundryTrustDetailPanel({
  laundryId,
  onBack,
}: {
  laundryId: string;
  onBack: () => void;
}) {
  const detailQ = useQuery({
    queryKey: queryKeys.adminLaundryTrustScore(laundryId),
    queryFn: () => getAdminLaundryTrustScoreDetail(laundryId),
  });

  if (detailQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (detailQ.error || !detailQ.data) {
    return (
      <InfoBanner variant="destructive" title="Could not load trust score">
        <button type="button" className="underline" onClick={onBack}>
          Back
        </button>
      </InfoBanner>
    );
  }

  const d = detailQ.data;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-primary hover:underline">
        ← All laundries
      </button>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{d.laundry_name}</h3>
            <p className="text-sm text-muted-foreground">
              {d.city}
              {d.owner_name ? ` · ${d.owner_name}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums">{d.trust_score}</p>
            <LaundryTrustScoreBadge level={d.level} className="mt-1" />
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <dt className="text-muted-foreground">On-time</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.on_time_delivery_pct}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Complaints</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.complaint_rate_pct}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Refunds</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.refund_rate_pct}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Disputes</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.dispute_rate_pct}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rating</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.avg_rating} ★</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="font-semibold tabular-nums">{d.metrics.completed_orders}</dd>
          </div>
        </dl>
      </article>

      <AdminPanel title="Score breakdown (sub-scores 0–100)" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {Object.entries(d.score_breakdown).map(([key, value]) => (
            <li key={key} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{BREAKDOWN_LABELS[key] ?? key}</span>
              <span className="font-bold tabular-nums">{value}</span>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}

export function AdminLaundryTrustScoresPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const listQ = useQuery({
    queryKey: queryKeys.adminLaundryTrustScores(),
    queryFn: listAdminLaundryTrustScores,
  });

  if (selectedId) {
    return <LaundryTrustDetailPanel laundryId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (listQ.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (listQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load laundry trust scores">
        Try refreshing the page.
      </InfoBanner>
    );
  }

  const q = search.toLowerCase();
  const rows = (listQ.data ?? []).filter(
    (r) =>
      r.laundry_name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      (r.owner_name?.toLowerCase().includes(q) ?? false) ||
      r.level.includes(q),
  );

  return (
    <AdminPanel
      title="Partner trust scores"
      meta={<span className="tabular-nums">{rows.length} laundries</span>}
      toolbar={
        <Input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-48 sm:w-56"
          aria-label="Search laundry trust scores"
        />
      }
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <div className="p-8">
          <EmptyState icon={Store} title="No laundries" description="Partner trust scores appear for registered laundries." />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r: LaundryTrustScoreSummary) => (
            <li key={r.laundry_id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/40"
                onClick={() => setSelectedId(r.laundry_id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.laundry_name}</span>
                    <LaundryTrustScoreBadge level={r.level} score={r.trust_score} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.city}
                    {r.owner_name ? ` · ${r.owner_name}` : ''} · {r.metrics.completed_orders} completed ·{' '}
                    {r.metrics.avg_rating} ★
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
