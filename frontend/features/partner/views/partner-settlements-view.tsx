'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { SettlementStatusBadge } from '@/features/admin/settlements/settlement-badges';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatInrCompact } from '@/features/admin/lib/format-admin';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { downloadPartnerSettlementExport, getPartnerSettlements } from '@/services/settlements';
import { Wallet, Clock, CheckCircle2 } from 'lucide-react';

export function PartnerSettlementsView() {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const dataQ = useQuery({
    queryKey: queryKeys.partnerSettlements(page),
    queryFn: () => getPartnerSettlements(page),
    staleTime: STALE.adminDashboard,
  });

  const d = dataQ.data;

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      await downloadPartnerSettlementExport(format);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader
        title="Settlements & earnings"
        description="Pending earnings, released payouts, and downloadable statements."
        actions={
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={exporting} onClick={() => handleExport('csv')}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              Statement
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={exporting} onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
              Excel
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={exporting} onClick={() => handleExport('pdf')}>
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Report
            </Button>
          </div>
        }
      />

      <KpiGrid className="sm:grid-cols-3">
        <KpiCard label="Pending earnings" value={d ? formatInrCompact(Number(d.pending_earnings_inr)) : '—'} status="warning" icon={Clock} loading={dataQ.isLoading} />
        <KpiCard label="Available earnings" value={d ? formatInrCompact(Number(d.available_earnings_inr)) : '—'} status="neutral" icon={Wallet} loading={dataQ.isLoading} />
        <KpiCard label="Released earnings" value={d ? formatInrCompact(Number(d.released_earnings_inr)) : '—'} status="healthy" icon={CheckCircle2} loading={dataQ.isLoading} />
      </KpiGrid>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Settlement ID</th>
              <th className="px-3 py-2 font-medium">Laundry</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium text-right">Orders</th>
              <th className="px-3 py-2 font-medium text-right">Net</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {(d?.items ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{row.settlement_code}</td>
                <td className="px-3 py-2">{row.laundry_name}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  <ClientDate iso={row.period_start} mode="date" /> – <ClientDate iso={row.period_end} mode="date" />
                </td>
                <td className="px-3 py-2 text-right">{row.orders_count}</td>
                <td className="px-3 py-2 text-right font-medium">{formatInr(Number(row.net_amount_inr))}</td>
                <td className="px-3 py-2"><SettlementStatusBadge status={row.status} /></td>
                <td className="px-3 py-2 text-xs">{row.paid_at ? <ClientDate iso={row.paid_at} mode="datetime" /> : '—'}</td>
              </tr>
            ))}
            {!d?.items.length && !dataQ.isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No settlements yet. Earnings appear after orders clear the 48-hour dispute window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(d?.total_pages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center text-xs text-muted-foreground">Page {page} of {d?.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= (d?.total_pages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </PartnerContent>
  );
}
