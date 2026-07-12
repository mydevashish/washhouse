'use client';

import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { ClientDate } from '@/components/ui/client-date';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { usePartnerOrders } from '@/features/partner/hooks/use-partner-operations';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';

/** Simplified activity log from current order snapshots until dedicated audit API ships. */
export function PartnerAuditView() {
  const ordersQ = usePartnerOrders();
  const orders = [...(ordersQ.data ?? [])].sort(
    (a, b) => new Date(b.pickup_at).getTime() - new Date(a.pickup_at).getTime(),
  );

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Activity log"
        description="Recent order activity at your laundry. Full audit trail coming soon."
      />

      <PartnerPanel meta={`${orders.length} records`} bodyClassName="p-0">
        {orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <>
        <ul className="divide-y divide-border/50 md:hidden">
          {orders.slice(0, 20).map((o) => (
            <li key={o.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">#{o.tracking_code}</span>
                <PartnerStatusBadge status={o.status} />
              </div>
              <p className="text-foreground">{o.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                <ClientDate iso={o.pickup_at} />
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                  <ClientDate iso={o.pickup_at} />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">#{o.tracking_code}</td>
                <td className="px-4 py-2.5">{o.customer_name}</td>
                <td className="px-4 py-2.5 text-xs">Order {getOrderStatusLabel(o.status).toLowerCase()}</td>
                <td className="px-4 py-2.5">
                  <PartnerStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
          </>
        )}
      </PartnerPanel>
    </PartnerContent>
  );
}
