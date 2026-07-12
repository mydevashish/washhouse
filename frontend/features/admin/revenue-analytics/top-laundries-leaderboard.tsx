'use client';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { TopLaundryLeaderboardRow } from '@/services/revenue-analytics';
import { cn } from '@/lib/utils';

type Props = {
  rows: TopLaundryLeaderboardRow[];
  onSelect?: (laundryId: string) => void;
  compact?: boolean;
};

export function TopLaundriesLeaderboard({ rows, onSelect, compact }: Props) {
  return (
    <AdminPanel
      title={compact ? 'Top 5 laundries' : 'Top performing laundries'}
      description="Ranked by revenue"
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Laundry</th>
              <th className="px-3 py-2 font-medium text-right">Revenue</th>
              <th className="px-3 py-2 font-medium text-right">Orders</th>
              <th className="px-3 py-2 font-medium text-right">Growth</th>
              <th className="px-3 py-2 font-medium text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.laundry_id}
                className={cn(
                  'border-b border-border/40 transition-colors',
                  onSelect && 'cursor-pointer hover:bg-muted/40',
                )}
                onClick={() => onSelect?.(row.laundry_id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect?.(row.laundry_id)}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
              >
                <td className="px-3 py-2.5 font-medium tabular-nums text-muted-foreground">
                  {row.rank}
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-foreground">{row.laundry_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.partner_name} · {row.city}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatInr(Number(row.revenue_inr))}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{row.orders_count}</td>
                <td
                  className={cn(
                    'px-3 py-2.5 text-right tabular-nums font-medium',
                    row.growth_pct.startsWith('-') ? 'text-destructive' : 'text-success',
                  )}
                >
                  {row.growth_pct}%
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                  {formatInr(Number(row.commission_inr))}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No revenue data for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}
