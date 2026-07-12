'use client';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { DisputeTypeBadge } from '@/features/admin/disputes/dispute-badges';
import { formatCount } from '@/features/admin/lib/format-admin';
import type {
  DisputeTypeBreakdown,
  HighRiskCustomerRow,
  HighRiskLaundryRow,
} from '@/services/dispute-analytics';
import { cn } from '@/lib/utils';

function riskBadgeClass(level: string): string {
  if (level === 'critical') return 'bg-red-500/15 text-red-700 dark:text-red-400';
  if (level === 'high') return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
  if (level === 'medium') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
}

type TopTypesProps = { rows: DisputeTypeBreakdown[]; loading?: boolean };

export function DisputeTypeBreakdownPanel({ rows, loading }: TopTypesProps) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />;
  }

  return (
    <AdminPanel title="Top dispute types" bodyClassName="p-0">
      <div className="divide-y divide-border/60">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No disputes in this period.</p>
        ) : (
          rows.map((row) => (
            <div key={row.complaint_type} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <DisputeTypeBadge type={row.complaint_type} label={row.type_label} />
                <span className="truncate text-xs text-muted-foreground">{row.pct}</span>
              </div>
              <span className="shrink-0 font-mono text-sm font-medium">{formatCount(row.count)}</span>
            </div>
          ))
        )}
      </div>
    </AdminPanel>
  );
}

type HighRiskProps = {
  customers: HighRiskCustomerRow[];
  laundries: HighRiskLaundryRow[];
  loading?: boolean;
};

export function HighRiskEntitiesPanel({ customers, laundries, loading }: HighRiskProps) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />
        <div className="h-64 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AdminPanel title="High risk customers" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-2 py-2 font-medium">Risk</th>
                <th className="px-2 py-2 font-medium text-right">Disputes</th>
                <th className="px-4 py-2 font-medium text-right">Refund rate</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                    No high-risk customers in this period.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.user_id} className="border-b border-border/40 last:border-0">
                    <td className="max-w-[140px] truncate px-4 py-2">
                      <div className="font-medium">{c.full_name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{c.email ?? '—'}</div>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                          riskBadgeClass(c.risk_level),
                        )}
                      >
                        {c.risk_label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono">{formatCount(c.dispute_count)}</td>
                    <td className="px-4 py-2 text-right font-mono">{c.refund_rate_pct}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel title="High risk laundries" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="px-4 py-2 font-medium">Laundry</th>
                <th className="px-2 py-2 font-medium">Risk</th>
                <th className="px-2 py-2 font-medium text-right">Complaints</th>
                <th className="px-4 py-2 font-medium text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {laundries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                    No high-risk laundries in this period.
                  </td>
                </tr>
              ) : (
                laundries.map((l) => (
                  <tr key={l.laundry_id} className="border-b border-border/40 last:border-0">
                    <td className="max-w-[140px] truncate px-4 py-2">
                      <div className="font-medium">{l.laundry_name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {l.city}, {l.state}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                          riskBadgeClass(l.risk_level),
                        )}
                      >
                        {l.risk_label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono">{formatCount(l.complaint_count)}</td>
                    <td className="px-4 py-2 text-right font-mono">{l.complaint_rate_pct}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
