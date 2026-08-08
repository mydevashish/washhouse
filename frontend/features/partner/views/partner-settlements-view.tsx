'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Download, FileSpreadsheet, FileText, Wallet } from 'lucide-react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { SettlementStatusBadge } from '@/features/admin/settlements/settlement-badges';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatInrCompact } from '@/features/admin/lib/format-admin';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { DEFAULT_PAGE_SIZE, getTotalRecords, normalizePageSize } from '@/lib/pagination/types';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { downloadPartnerSettlementExport, getPartnerSettlements } from '@/services/settlements';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';

export function PartnerSettlementsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [exporting, setExporting] = useState(false);
  const enabled = usePartnerQueriesEnabled();

  const dataQ = useQuery({
    queryKey: queryKeys.partnerSettlements(page, pageSize),
    queryFn: () => getPartnerSettlements(page, pageSize),
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const d = dataQ.data;
  const totalRecords = d ? getTotalRecords(d) : 0;
  const pageCount = d?.total_pages ?? 1;
  const pageStart = totalRecords === 0 ? 0 : (page - 1) * pageSize;
  const pageEnd = Math.min(page * pageSize, totalRecords);

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

      <div className="rounded-lg bg-brand-50/80 px-3 py-2.5 text-sm text-muted-foreground ring-1 ring-brand-500/20 dark:bg-brand-900/20">
        <p>
          Settlements pay your <span className="font-semibold text-foreground">net</span> after the
          platform commission cut. See the full split on{' '}
          <Link href="/partner/revenue" className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-50">
            Money
          </Link>
          .
        </p>
      </div>
      {dataQ.isError && (
        <QueryErrorState
          title="Could not load settlements"
          message={getApiErrorMessage(dataQ.error)}
          onRetry={() => void dataQ.refetch()}
          isRetrying={dataQ.isFetching}
        />
      )}

      <KpiGrid className="sm:grid-cols-3">
        <KpiCard label="Pending earnings" value={d ? formatInrCompact(Number(d.pending_earnings_inr)) : '—'} status="warning" icon={Clock} loading={dataQ.isLoading} />
        <KpiCard label="Available earnings" value={d ? formatInrCompact(Number(d.available_earnings_inr)) : '—'} status="neutral" icon={Wallet} loading={dataQ.isLoading} />
        <KpiCard label="Released earnings" value={d ? formatInrCompact(Number(d.released_earnings_inr)) : '—'} status="healthy" icon={CheckCircle2} loading={dataQ.isLoading} />
      </KpiGrid>

      <div className="overflow-x-auto rounded-xl border border-border">
        {dataQ.isLoading && <Skeleton className="m-4 h-48 w-full rounded-lg" />}
        {!dataQ.isLoading && (
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
            {!dataQ.isError && !d?.items.length && !dataQ.isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-8">
                  <EmptyState
                    icon={Wallet}
                    title="No settlements yet"
                    description="Earnings appear after orders clear the 48-hour dispute window."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {!dataQ.isError && totalRecords > 0 ? (
        <DataTablePagination
          page={d?.page ?? page}
          pageCount={pageCount}
          pageSize={d?.page_size ?? pageSize}
          pageStart={pageStart}
          pageEnd={pageEnd}
          totalCount={totalRecords}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(normalizePageSize(size));
            setPage(1);
          }}
        />
      ) : null}
    </PartnerContent>
  );
}
