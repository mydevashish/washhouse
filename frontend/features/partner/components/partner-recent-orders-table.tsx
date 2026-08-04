'use client';

import Link from 'next/link';

import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { PartnerOrderSourceBadge } from '@/features/partner/components/partner-order-source-badge';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { PartnerOrder } from '@/services/partner';

type PartnerRecentOrdersTableProps = {
  orders: PartnerOrder[];
  limit?: number;
};

export function PartnerRecentOrdersTable({ orders, limit = 8 }: PartnerRecentOrdersTableProps) {
  const rows = orders.slice(0, limit);

  return (
    <PartnerPanel
      title="Recent orders"
      meta={<span className="tabular-nums">{rows.length} shown</span>}
      toolbar={
        <Link href="/partner/orders" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      }
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recent orders.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-sticky-head border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Order</th>
                <th className="px-4 py-2 font-semibold">Customer</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((o) => (
                <tr key={o.id} className="h-table-row hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link
                      href={`/partner/orders/${o.id}`}
                      className="inline-flex flex-wrap items-center gap-1.5 font-mono text-xs font-medium text-foreground hover:text-primary hover:underline"
                    >
                      <span>#{o.tracking_code}</span>
                      <PartnerOrderSourceBadge order={o} />
                    </Link>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-2">{o.customer_name}</td>
                  <td className="px-4 py-2 tabular-nums font-medium">{formatInr(Number(o.total_inr))}</td>
                  <td className="px-4 py-2">
                    <PartnerStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PartnerPanel>
  );
}
