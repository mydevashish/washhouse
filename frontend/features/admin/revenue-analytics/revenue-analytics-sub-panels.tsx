'use client';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type {
  CommissionAnalytics,
  DisputeAnalytics,
  RefundAnalytics,
} from '@/services/revenue-analytics';

type Props = {
  commission: CommissionAnalytics;
  refunds: RefundAnalytics;
  disputes: DisputeAnalytics;
};

export function RevenueAnalyticsSubPanels({ commission, refunds, disputes }: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <AdminPanel title="Commission analytics" bodyClassName="space-y-2 p-3 text-xs">
        <Row label="Laundry revenue" value={formatInr(Number(commission.total_laundry_revenue_inr))} />
        <Row label="Avg commission %" value={`${commission.average_commission_pct}%`} />
        <Row label="Commission earned" value={formatInr(Number(commission.total_commission_earned_inr))} />
        <Row label="Net partner earnings" value={formatInr(Number(commission.total_net_partner_earnings_inr))} />
        <Row label="Pending settlements" value={formatInr(Number(commission.pending_settlements_inr))} />
        <Row label="Completed settlements" value={formatInr(Number(commission.completed_settlements_inr))} />
      </AdminPanel>

      <AdminPanel title="Refund analytics" bodyClassName="space-y-2 p-3 text-xs">
        <Row label="Refund amount" value={formatInr(Number(refunds.refund_amount_inr))} />
        <Row label="Refund count" value={String(refunds.refund_count)} />
        <Row label="Refund rate" value={`${refunds.refund_pct}%`} />
        {refunds.by_reason.slice(0, 4).map((r) => (
          <Row
            key={r.reason}
            label={r.reason.replace(/_/g, ' ')}
            value={`${r.count} · ${formatInr(Number(r.amount_inr))}`}
            muted
          />
        ))}
      </AdminPanel>

      <AdminPanel title="Dispute analytics" bodyClassName="space-y-2 p-3 text-xs">
        <Row label="Open disputes" value={String(disputes.open_disputes)} />
        <Row label="Resolved disputes" value={String(disputes.resolved_disputes)} />
        <Row label="Dispute rate" value={`${disputes.dispute_rate_pct}%`} />
        {disputes.common_issues.slice(0, 4).map((issue) => (
          <Row
            key={issue.label}
            label={issue.label.replace(/_/g, ' ')}
            value={String(issue.orders)}
            muted
          />
        ))}
      </AdminPanel>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={muted ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
