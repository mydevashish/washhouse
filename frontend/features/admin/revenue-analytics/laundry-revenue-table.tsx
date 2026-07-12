'use client';

import { useMemo } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { LaundryStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { LaundryRevenueRow } from '@/services/revenue-analytics';
import { cn } from '@/lib/utils';

type Props = {
  rows: LaundryRevenueRow[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (laundryId: string) => void;
};

export function LaundryRevenueTable({
  rows,
  total,
  page,
  totalPages,
  loading,
  onPageChange,
  onView,
}: Props) {
  const columns = useMemo(
    () =>
      [
        'Laundry',
        'Partner',
        'Location',
        'Orders',
        'Revenue',
        'Commission',
        'Net payout',
        'Refunds',
        'Disputes',
        'Rating',
        'Status',
        'Actions',
      ] as const,
    [],
  );

  return (
    <AdminPanel
      title="Laundry-wise revenue"
      description={`${total.toLocaleString('en-IN')} laundries`}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c}
                  className={cn(
                    'px-2.5 py-2 font-medium whitespace-nowrap',
                    ['Orders', 'Revenue', 'Commission', 'Net payout', 'Refunds', 'Disputes', 'Rating', 'Actions'].includes(c) &&
                      'text-right',
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td colSpan={12} className="px-2.5 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))}
            {!loading &&
              rows.map((row) => (
                <tr key={row.laundry_id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-2.5 py-2 font-medium">{row.laundry_name}</td>
                  <td className="px-2.5 py-2 text-muted-foreground">{row.partner_name}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    {row.city}, {row.state}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums">{row.orders_count}</td>
                  <td className="px-2.5 py-2 text-right font-medium tabular-nums">
                    {formatInr(Number(row.revenue_inr))}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                    {formatInr(Number(row.commission_inr))}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums">
                    {formatInr(Number(row.net_payout_inr))}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-destructive/80">
                    {formatInr(Number(row.refund_amount_inr))}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums">{row.disputes_count}</td>
                  <td className="px-2.5 py-2 text-right tabular-nums">{row.average_rating}</td>
                  <td className="px-2.5 py-2 text-right">
                    <LaundryStatusBadge status={row.status} />
                  </td>
                  <td className="px-2.5 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => onView(row.laundry_id)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-muted-foreground">
                  No laundries match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
