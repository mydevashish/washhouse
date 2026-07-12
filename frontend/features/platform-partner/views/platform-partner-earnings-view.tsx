'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Percent, Wallet } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatInrCompact } from '@/features/admin/lib/format-admin';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { formatPeriodLabel, getPartnerProfitSharingSummary } from '@/services/profit-sharing';

export function PlatformPartnerEarningsView() {
  const summaryQ = useQuery({
    queryKey: queryKeys.platformPartnerProfitSharing(),
    queryFn: getPartnerProfitSharingSummary,
    staleTime: STALE.adminDashboard,
    refetchInterval: 60_000,
  });

  const s = summaryQ.data;
  const linked = Boolean(s?.partner_id);

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="My earnings"
        description="Profit share based on your platform ownership percentage."
      />

      {!linked && !summaryQ.isLoading && (
        <InfoBanner variant="default" title="Account not linked">
          Your login is not linked to an ownership partner record. Contact DLM admin to associate your account.
        </InfoBanner>
      )}

      {summaryQ.isError && (
        <InfoBanner variant="destructive" title="Could not load earnings">
          {getApiErrorMessage(summaryQ.error, 'GET /platform-partner/profit-sharing/summary failed')}
        </InfoBanner>
      )}

      <KpiGrid className="lg:grid-cols-3">
        <KpiCard
          label="Ownership"
          value={s?.ownership_pct ? `${s.ownership_pct}%` : '—'}
          icon={Percent}
          loading={summaryQ.isLoading}
        />
        <KpiCard
          label="Pending earnings"
          value={s ? formatInrCompact(Number(s.pending_earnings_inr)) : '—'}
          icon={Clock}
          loading={summaryQ.isLoading}
        />
        <KpiCard
          label="Paid earnings"
          value={s ? formatInrCompact(Number(s.paid_earnings_inr)) : '—'}
          icon={CheckCircle2}
          loading={summaryQ.isLoading}
          status="healthy"
        />
      </KpiGrid>

      <AdminPanel title="Pending payouts" meta={<Clock className="h-4 w-4 text-muted-foreground" aria-hidden />} bodyClassName="p-0">
        {summaryQ.isLoading && <div className="h-24 animate-pulse bg-muted/30" />}
        {!summaryQ.isLoading && (s?.pending_allocations.length ?? 0) === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No pending payouts.</p>
        )}
        {!summaryQ.isLoading && (s?.pending_allocations.length ?? 0) > 0 && (
          <EarningsTable rows={s!.pending_allocations} />
        )}
      </AdminPanel>

      <AdminPanel title="Payout history" meta={<Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />} bodyClassName="p-0">
        {summaryQ.isLoading && <div className="h-24 animate-pulse bg-muted/30" />}
        {!summaryQ.isLoading && (s?.payout_history.length ?? 0) === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No payout history yet.</p>
        )}
        {!summaryQ.isLoading && (s?.payout_history.length ?? 0) > 0 && (
          <EarningsTable rows={s!.payout_history} showPaid />
        )}
      </AdminPanel>
    </AdminContent>
  );
}

function EarningsTable({
  rows,
  showPaid,
}: {
  rows: { period_year: number; period_month: number; ownership_pct: string; earnings_inr: string; payout_status: string; paid_at: string | null; payment_reference: string | null }[];
  showPaid?: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
        <tr>
          <th className="px-4 py-2.5">Period</th>
          <th className="px-4 py-2.5">Ownership</th>
          <th className="px-4 py-2.5 text-right">Earnings</th>
          {showPaid && <th className="px-4 py-2.5">Reference</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="px-4 py-2.5">{formatPeriodLabel(r.period_year, r.period_month)}</td>
            <td className="px-4 py-2.5">{r.ownership_pct}%</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{formatInr(Number(r.earnings_inr))}</td>
            {showPaid && (
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {r.payment_reference ?? '—'}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
