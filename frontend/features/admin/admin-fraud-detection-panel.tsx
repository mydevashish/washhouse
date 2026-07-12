'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { FraudRiskBadge } from '@/features/admin/components/fraud-risk-badge';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import { queryKeys } from '@/lib/query-keys';
import {
  acknowledgeFraudAlert,
  FRAUD_RISK_LABELS,
  getFraudAlert,
  getFraudRiskSummary,
  listFraudAlerts,
  resolveFraudAlert,
  type FraudAlert,
  type FraudAlertStatus,
} from '@/services/fraud-detection';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { id: FraudAlertStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'resolved', label: 'Resolved' },
];

function FraudAlertDetail({ alertId, onBack }: { alertId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const detailQ = useQuery({
    queryKey: queryKeys.adminFraudAlert(alertId),
    queryFn: () => getFraudAlert(alertId),
  });

  const ackM = useMutation({
    mutationFn: () => acknowledgeFraudAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminFraudAlerts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminFraudSummary() });
      toast.success('Alert acknowledged');
    },
  });

  const resolveM = useMutation({
    mutationFn: () => resolveFraudAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminFraudAlerts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminFraudSummary() });
      toast.success('Alert resolved');
    },
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
      <InfoBanner variant="destructive" title="Could not load alert">
        <button type="button" className="underline" onClick={onBack}>
          Back
        </button>
      </InfoBanner>
    );
  }

  const a = detailQ.data;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-primary hover:underline">
        ← All alerts
      </button>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {a.subject_type === 'customer' ? 'Customer' : 'Partner'} · {a.signal_label}
            </p>
            <h3 className="mt-1 text-lg font-bold">{a.title}</h3>
            <p className="text-sm text-muted-foreground">{a.subject_name ?? a.subject_id}</p>
          </div>
          <FraudRiskBadge level={a.risk_level} />
        </div>
        <p className="mt-4 text-sm">{a.description}</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-semibold capitalize">{a.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-semibold">{formatOrderTimestamp(a.created_at)}</dd>
          </div>
        </dl>
        {a.status !== 'resolved' && (
          <div className="mt-4 flex flex-wrap gap-2">
            {a.status === 'open' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={ackM.isPending}
                onClick={() => ackM.mutate()}
              >
                Acknowledge
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={resolveM.isPending}
              onClick={() => resolveM.mutate()}
            >
              Mark resolved
            </Button>
          </div>
        )}
      </article>
    </div>
  );
}

export function AdminFraudDetectionPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FraudAlertStatus | 'all'>('open');

  const summaryQ = useQuery({
    queryKey: queryKeys.adminFraudSummary(),
    queryFn: getFraudRiskSummary,
  });

  const listQ = useQuery({
    queryKey: queryKeys.adminFraudAlerts(statusFilter),
    queryFn: () =>
      listFraudAlerts(statusFilter === 'all' ? undefined : { status: statusFilter }),
  });

  if (selectedId) {
    return <FraudAlertDetail alertId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (listQ.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (listQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load fraud alerts">
        Try refreshing the page.
      </InfoBanner>
    );
  }

  const summary = summaryQ.data;
  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-3 sm:grid-cols-4">
          {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
            <div key={level} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Open {FRAUD_RISK_LABELS[level]}</p>
              <p className="text-2xl font-bold tabular-nums">{summary.open_by_risk[level] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <AdminPanel
        title="Fraud alerts"
        meta={<span className="tabular-nums">{rows.length} alerts</span>}
        toolbar={
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold',
                  statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={AlertOctagon} title="No alerts" description="Fraud signals appear here when rules trigger." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r: FraudAlert) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/40"
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{r.signal_label}</span>
                      <FraudRiskBadge level={r.risk_level} />
                      <span className="text-xs capitalize text-muted-foreground">{r.status}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {r.subject_name ?? r.subject_id} · {r.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
