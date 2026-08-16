'use client';

import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { formatServices } from '@/features/partner/lib/partner-derive';
import { PARTNER_BTN, PARTNER_INPUT } from '@/features/partner/lib/partner-compact';
import { usePartnerOrders } from '@/features/partner/hooks/use-partner-operations';
import {
  isValidCustomReportsRange,
  PARTNER_ORDERS_EXPORT_PAGE_SIZE,
  PARTNER_REPORTS_PERIOD_OPTIONS,
  resolvePartnerReportsDateRange,
  type PartnerReportsPeriod,
} from '@/features/partner/lib/partner-reports-period';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';
import { cn } from '@/lib/utils';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PartnerReportsView() {
  const [period, setPeriod] = useState<PartnerReportsPeriod>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo(
    () => resolvePartnerReportsDateRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const customReady = period !== 'custom' || isValidCustomReportsRange(customFrom, customTo);

  const ordersQ = usePartnerOrders({
    page: 1,
    page_size: PARTNER_ORDERS_EXPORT_PAGE_SIZE,
    bucket: 'all',
    date_from: customReady ? range.date_from : undefined,
    date_to: customReady ? range.date_to : undefined,
  });

  const orders = ordersQ.data?.items ?? [];
  const totalKnown = ordersQ.data?.total_records ?? orders.length;
  const capped = totalKnown > orders.length;
  const delivered = orders.filter((o) => o.status === 'delivered');

  function exportOrders() {
    const header = ['Order ID', 'Customer', 'Services', 'Amount', 'Status', 'Payment'];
    const rows = orders.map((o) => [
      o.tracking_code,
      o.customer_name,
      formatServices(o),
      o.total_inr,
      getOrderStatusLabel(o.status),
      o.payment_status,
    ]);
    downloadCsv(`orders-report-${range.slug}.csv`, [header, ...rows]);
  }

  function exportRevenue() {
    const header = ['Order ID', 'Customer', 'Amount', 'Status'];
    const rows = delivered.map((o) => [o.tracking_code, o.customer_name, o.total_inr, o.status]);
    const total = delivered.reduce((s, o) => s + Number(o.total_inr), 0);
    downloadCsv(`revenue-report-${range.slug}.csv`, [
      header,
      ...rows,
      [],
      ['Total', '', String(total.toFixed(2)), ''],
    ]);
  }

  return (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader title="Reports" description="Export order and revenue data." />

      <div className="space-y-2">
        <div
          role="group"
          aria-label="Report date range"
          className="flex flex-wrap gap-2"
          data-testid="partner-reports-period-bar"
        >
          {PARTNER_REPORTS_PERIOD_OPTIONS.map((option) => {
            const selected = period === option.value;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={`partner-reports-period-${option.value}`}
                aria-pressed={selected}
                className={cn(
                  PARTNER_BTN,
                  'rounded-full border px-3 text-sm font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {period === 'custom' ? (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="partner-reports-from"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                From (IST)
              </label>
              <Input
                id="partner-reports-from"
                type="date"
                className={cn(PARTNER_INPUT, 'w-[10.5rem] text-sm')}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                data-testid="partner-reports-date-from"
              />
            </div>
            <div>
              <label
                htmlFor="partner-reports-to"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                To (IST)
              </label>
              <Input
                id="partner-reports-to"
                type="date"
                className={cn(PARTNER_INPUT, 'w-[10.5rem] text-sm')}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                data-testid="partner-reports-date-to"
              />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {range.label}
        </p>
      </div>

      {capped ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Export includes the latest {orders.length} of {totalKnown} orders in this range. Narrow the
          date window if you need a full export.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <PartnerPanel title="Orders report" description="Orders created in the selected range" bodyClassName="px-4 py-4">
          <Button
            type="button"
            size="sm"
            className={cn(PARTNER_BTN, 'gap-2')}
            onClick={exportOrders}
            disabled={!orders.length || ordersQ.isLoading || !customReady}
            data-testid="partner-reports-export-orders"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{orders.length} orders included</p>
        </PartnerPanel>
        <PartnerPanel title="Revenue report" description="Delivered orders in the selected range" bodyClassName="px-4 py-4">
          <Button
            type="button"
            size="sm"
            className={cn(PARTNER_BTN, 'gap-2')}
            onClick={exportRevenue}
            disabled={!delivered.length || ordersQ.isLoading || !customReady}
            data-testid="partner-reports-export-revenue"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Total delivered: {formatInr(delivered.reduce((s, o) => s + Number(o.total_inr), 0))}
          </p>
        </PartnerPanel>
      </div>
      <p className="text-xs text-muted-foreground">Excel export opens CSV in Excel or Google Sheets.</p>
    </PartnerContent>
  );
}
