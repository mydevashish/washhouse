'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { formatServices } from '@/features/partner/lib/partner-derive';
import { usePartnerOrders } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';

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
  const ordersQ = usePartnerOrders();
  const orders = ordersQ.data ?? [];

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
    downloadCsv(`orders-report-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  function exportRevenue() {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const header = ['Order ID', 'Customer', 'Amount', 'Status'];
    const rows = delivered.map((o) => [o.tracking_code, o.customer_name, o.total_inr, o.status]);
    const total = delivered.reduce((s, o) => s + Number(o.total_inr), 0);
    downloadCsv(`revenue-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      header,
      ...rows,
      [],
      ['Total', '', String(total.toFixed(2)), ''],
    ]);
  }

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title="Reports" description="Export order and revenue data." />

      <div className="grid gap-4 sm:grid-cols-2">
        <PartnerPanel title="Orders report" description="All orders in your queue" bodyClassName="px-4 py-4">
          <Button type="button" className="gap-2" onClick={exportOrders} disabled={!orders.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{orders.length} orders included</p>
        </PartnerPanel>
        <PartnerPanel title="Revenue report" description="Delivered orders only" bodyClassName="px-4 py-4">
          <Button
            type="button"
            className="gap-2"
            onClick={exportRevenue}
            disabled={!orders.some((o) => o.status === 'delivered')}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Total delivered:{' '}
            {formatInr(
              orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.total_inr), 0),
            )}
          </p>
        </PartnerPanel>
      </div>
      <p className="text-xs text-muted-foreground">Excel export opens CSV in Excel or Google Sheets.</p>
    </PartnerContent>
  );
}
