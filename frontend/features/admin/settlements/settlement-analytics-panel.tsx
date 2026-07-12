'use client';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInrCompact } from '@/features/admin/lib/format-admin';
import { SettlementStatusBadge } from '@/features/admin/settlements/settlement-badges';
import type { SettlementAnalytics } from '@/services/settlements';

type Props = {
  analytics: SettlementAnalytics | undefined;
  loading?: boolean;
};

export function SettlementAnalyticsPanel({ analytics, loading }: Props) {
  if (loading) {
    return (
      <AdminPanel title="Settlement analytics" meta="Loading…">
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      </AdminPanel>
    );
  }
  if (!analytics) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminPanel title="Status breakdown" meta={`Avg batch ${formatInrCompact(Number(analytics.avg_settlement_inr))}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Count</th>
                <th className="px-3 py-2 font-medium text-right">Net (INR)</th>
              </tr>
            </thead>
            <tbody>
              {analytics.status_breakdown.map((row) => (
                <tr key={row.status} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <SettlementStatusBadge status={row.status as never} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInrCompact(Number(row.total_inr))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Monthly payouts"
        meta={`Gross paid ${formatInrCompact(Number(analytics.total_gross_paid_inr))} · Commission ${formatInrCompact(Number(analytics.total_commission_paid_inr))}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Month</th>
                <th className="px-3 py-2 font-medium text-right">Payouts</th>
                <th className="px-3 py-2 font-medium text-right">Commission</th>
                <th className="px-3 py-2 font-medium text-right">Batches</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthly_payouts.map((row) => (
                <tr key={row.month} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2 font-medium">{row.month}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInrCompact(Number(row.payout_inr))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInrCompact(Number(row.commission_inr))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.settlement_count}</td>
                </tr>
              ))}
              {!analytics.monthly_payouts.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No paid settlements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel title="Top partners by payout" className="lg:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Partner</th>
                <th className="px-3 py-2 font-medium">Laundry</th>
                <th className="px-3 py-2 font-medium text-right">Paid</th>
                <th className="px-3 py-2 font-medium text-right">Settlements</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_partners.map((row) => (
                <tr key={row.partner_user_id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2 font-medium">{row.partner_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.laundry_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInrCompact(Number(row.paid_inr))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.settlement_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
