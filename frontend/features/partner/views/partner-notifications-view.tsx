'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CreditCard, Package } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { buildAttentionItems } from '@/features/partner/lib/partner-derive';
import { usePartnerOrders, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useMounted } from '@/lib/hooks/use-mounted';

/**
 * Attention feed derived from current open order pages (not a full notifications API).
 * Uses larger pages so payment/SLA alerts are less incomplete until a dedicated endpoint ships.
 */
export function PartnerNotificationsView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const ordersQ = usePartnerOrders({ page: 1, page_size: 50, bucket: 'action' });
  const openQ = usePartnerOrders({ page: 1, page_size: 50, bucket: 'active' });

  const loading = queriesEnabled && (ordersQ.isPending || openQ.isPending);
  const error = ordersQ.isError ? ordersQ.error : openQ.isError ? openQ.error : null;

  const orders =
    mounted && queriesEnabled
      ? [...(ordersQ.data?.items ?? []), ...(openQ.data?.items ?? [])]
      : [];
  const attention = buildAttentionItems(
    orders,
    mounted && queriesEnabled ? Date.now() : undefined,
  );

  const items = attention.map((a) => ({
    id: a.id,
    icon: a.type === 'new_order' ? Package : a.type === 'payment' ? CreditCard : AlertTriangle,
    title: a.title,
    body: a.description,
    href: `/partner/orders/${a.orderId}`,
  }));

  const actionTotal = ordersQ.data?.total_records ?? 0;
  const activeTotal = openQ.data?.total_records ?? 0;
  const truncated = actionTotal > 50 || activeTotal > 50;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Notifications"
        description="Open-order alerts that need attention (from current queues — not a full inbox yet)."
      />

      <PartnerPanel bodyClassName="p-0">
        {loading ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        {error ? (
          <div className="p-4">
            <QueryErrorState
              title="Could not load alerts"
              message={getApiErrorMessage(error)}
              onRetry={() => {
                void ordersQ.refetch();
                void openQ.refetch();
              }}
              isRetrying={ordersQ.isFetching || openQ.isFetching}
            />
          </div>
        ) : null}
        {!loading && !error && truncated ? (
          <p className="border-b border-border/50 px-4 py-2 text-xs text-muted-foreground">
            Showing alerts from up to 50 action + 50 active orders. Open Orders for the full queue.
          </p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            All caught up — no new alerts.
          </p>
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="divide-y divide-border/50">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </PartnerPanel>
    </PartnerContent>
  );
}
