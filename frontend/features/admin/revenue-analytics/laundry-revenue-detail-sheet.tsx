'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { LaundryRevenueDetail } from '@/services/revenue-analytics';
import { RevenueAnalyticsSubPanels } from '@/features/admin/revenue-analytics/revenue-analytics-sub-panels';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: LaundryRevenueDetail | undefined;
  loading?: boolean;
};

export function LaundryRevenueDetailSheet({ open, onOpenChange, detail, loading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {loading && (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {!loading && detail && (
          <>
            <DialogHeader>
              <DialogTitle>{detail.laundry_name}</DialogTitle>
              <DialogDescription>
                {detail.partner_name} · {detail.city}, {detail.state} · {detail.status.replace(/_/g, ' ')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <AdminPanel title="Revenue summary" bodyClassName="grid grid-cols-2 gap-3 p-3 text-xs">
                <Stat label="Revenue" value={formatInr(Number(detail.overview.total_platform_revenue_inr))} />
                <Stat label="Commission" value={formatInr(Number(detail.overview.platform_commission_inr))} />
                <Stat label="Orders" value={String(detail.overview.total_orders)} />
                <Stat label="AOV" value={formatInr(Number(detail.overview.average_order_value_inr))} />
                <Stat label="Rating" value={detail.average_rating} />
                <Stat label="Commission rate" value={`${detail.commission_rate}%`} />
              </AdminPanel>

              <RevenueAnalyticsSubPanels
                commission={detail.commission}
                refunds={detail.refunds}
                disputes={detail.disputes}
              />

              {detail.partner_branches && detail.partner_branches.branch_count > 1 && (
                <AdminPanel
                  title="Multi-branch comparison"
                  description={`${detail.partner_branches.branch_count} branches · ${formatInr(Number(detail.partner_branches.total_revenue_inr))} total`}
                  bodyClassName="p-0"
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase text-muted-foreground">
                        <th className="px-3 py-2">Branch</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                        <th className="px-3 py-2 text-right">Orders</th>
                        <th className="px-3 py-2 text-right">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.partner_branches.branches.map((b) => (
                        <tr key={b.laundry_id} className="border-b border-border/40">
                          <td className="px-3 py-2">
                            <p className="font-medium">{b.laundry_name}</p>
                            <p className="text-[11px] text-muted-foreground">{b.city}</p>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatInr(Number(b.revenue_inr))}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{b.orders_count}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{b.growth_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminPanel>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
