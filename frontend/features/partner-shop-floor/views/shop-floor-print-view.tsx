'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerTagsOrderSearch } from '@/features/partner/hooks/use-partner-tags-order-search';
import { getApiErrorMessage } from '@/lib/api-error-message';

export function ShopFloorPrintView() {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const { orders, shouldSearch, isLoading, isError, error, refetch, isFetching } =
    usePartnerTagsOrderSearch(query);

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

        {shouldSearch && isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading orders…
          </p>
        ) : null}

        {shouldSearch && isError ? (
          <QueryErrorState
            title="Could not load orders"
            message={getApiErrorMessage(error, 'Try again')}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : null}

        {!trimmedQuery ? (
          <p className="text-sm text-muted-foreground">
            After you create an order, use Success → Print tags / Bill / GST invoice, or reprint here.
          </p>
        ) : !shouldSearch ? (
          <p className="text-sm text-muted-foreground">
            Enter at least 3 characters, or a tracking code (WH-) or token (R-).
          </p>
        ) : !isLoading && !isError && orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching orders.</p>
        ) : shouldSearch && orders.length > 0 ? (
          <ul className="space-y-3">
            {orders.map((order) => (
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
        ) : null}

        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/partner/orders?chip=ready_today">Ready today</Link>
        </Button>
      </PartnerPanel>
    </div>
  );
}
