'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

function matchesQuery(order: PartnerOrder, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return false;
  const phone = (order.customer_phone ?? '').replace(/\D/g, '');
  const qDigits = q.replace(/\D/g, '');
  if (qDigits.length >= 4 && phone.endsWith(qDigits)) return true;
  if (order.tracking_code.toLowerCase().includes(q)) return true;
  if (order.token_code?.toLowerCase().includes(q)) return true;
  return false;
}

export function ShopFloorPrintView() {
  const [query, setQuery] = useState('');
  const ordersQ = useQuery({
    queryKey: queryKeys.partnerOrders({ surface: 'floor', page_size: 50 }),
    queryFn: () => listPartnerOrders({ page: 1, page_size: 50, bucket: 'active' }),
    staleTime: STALE.partnerAnalytics,
  });

  const matches = useMemo(() => {
    const rows = ordersQ.data?.items ?? [];
    if (!query.trim()) return [];
    return rows.filter((o) => matchesQuery(o, query)).slice(0, 12);
  }, [ordersQ.data, query]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="shop-floor-print-center">
      <PartnerPanel
        title="Print"
        description="Tags / bill / GST invoice — search by phone or tracking"
        bodyClassName="space-y-4 p-4"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="min-h-12 pl-9 text-base"
            placeholder="Phone last-4 / tracking / R-42"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="print-center-search"
            inputMode="search"
            autoComplete="off"
          />
        </div>

        {ordersQ.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading orders…
          </p>
        ) : null}

        {ordersQ.isError ? (
          <QueryErrorState
            title="Could not load orders"
            message={getApiErrorMessage(ordersQ.error, 'Try again')}
            onRetry={() => void ordersQ.refetch()}
            isRetrying={ordersQ.isFetching}
          />
        ) : null}

        {!query.trim() ? (
          <p className="text-sm text-muted-foreground">
            After you create an order, use Success → Print tags / Bill / GST invoice, or reprint here.
          </p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching orders.</p>
        ) : (
          <ul className="space-y-3">
            {matches.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-border bg-card px-3 py-3"
              >
                <div className="mb-2 min-w-0">
                  <ColorTokenChip
                    colorToken={order.color_token}
                    tokenCode={order.token_code}
                    size="sm"
                  />
                  <p className="mt-1 truncate text-sm font-medium">{order.customer_name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    #{order.tracking_code}
                    {order.customer_phone ? ` · ${order.customer_phone}` : ''}
                  </p>
                </div>
                <PrintOrderActions orderId={order.id} />
              </li>
            ))}
          </ul>
        )}

        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/partner/orders?chip=ready_today">Ready today</Link>
        </Button>
      </PartnerPanel>
    </div>
  );
}
