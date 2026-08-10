'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Search, Tag } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { usePartnerTagsOrderSearch } from '@/features/partner/hooks/use-partner-tags-order-search';
import { PartnerDashboardTagsVerifyPanel } from '@/features/partner/components/partner-dashboard-tags-verify-panel';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { buildPartnerPrintPath } from '@/features/partner-shop-floor/lib/print-lifecycle';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import type { PartnerOrder } from '@/services/partner';

function TagsSearchResultCard({
  order,
  verifyExpanded,
  onToggleVerify,
}: {
  order: PartnerOrder;
  verifyExpanded: boolean;
  onToggleVerify: () => void;
}) {
  const printHref = buildPartnerPrintPath(order.id, 'tags');
  const verifyPanelId = `partner-dashboard-tags-verify-panel-${order.id}`;

  return (
    <article
      className="rounded-3xl border border-border bg-background p-4 shadow-sm"
      data-testid="partner-dashboard-tags-result"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <ColorTokenChip
            colorToken={order.color_token}
            tokenCode={order.token_code}
            size="sm"
          />
          <div className="space-y-0.5">
            <p className="truncate font-medium text-foreground">{order.customer_name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              #{order.tracking_code}
              {order.customer_phone ? (
                <span className="font-sans"> · {order.customer_phone}</span>
              ) : null}
            </p>
          </div>
          <PartnerStatusBadge status={order.status} />
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button type="button" className="min-h-11 w-full sm:w-auto" asChild>
            <Link
              href={printHref}
              data-testid="partner-dashboard-tags-print-link"
            >
              <Tag className="mr-2 h-4 w-4" aria-hidden />
              Print tags
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            aria-expanded={verifyExpanded}
            aria-controls={verifyPanelId}
            data-testid="partner-dashboard-tags-verify-trigger"
            onClick={onToggleVerify}
          >
            Verify tags
          </Button>
        </div>
      </div>

      {verifyExpanded ? (
        <div id={verifyPanelId}>
          <PartnerDashboardTagsVerifyPanel orderId={order.id} />
        </div>
      ) : null}
    </article>
  );
}

export function PartnerDashboardTagsSection() {
  const [query, setQuery] = useState('');
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const hintId = useId();
  const trimmedQuery = query.trim();

  const { orders, shouldSearch, isLoading, isError, error, refetch, isFetching } =
    usePartnerTagsOrderSearch(query);

  return (
    <section aria-label="Tags" data-testid="partner-dashboard-tags">
      <PartnerOpsSurface className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Tags</h2>
            <p className="text-sm text-muted-foreground">
              Find order · verify labels · reprint
            </p>
          </div>
          <Link
            href="/partner/floor/print"
            className={cn(
              'inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline',
            )}
            data-testid="partner-dashboard-tags-print-center-header"
          >
            Print center
          </Link>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            className="min-h-11 pl-9 text-base sm:min-h-11"
            placeholder="Order no. · phone · R-42"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={hintId}
            data-testid="partner-dashboard-tags-search"
            inputMode="search"
            autoComplete="off"
          />
        </div>
        <p id={hintId} className="text-xs text-muted-foreground">
          Search by tracking code (WH-…), customer phone, color token (R-42), or name. Reprint when
          a tag is lost or misplaced.
        </p>

        {!trimmedQuery ? (
          <p
            className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
            data-testid="partner-dashboard-tags-idle"
          >
            Enter an order number, phone, or token above to find labels for reprint.
          </p>
        ) : !shouldSearch ? (
          <p className="text-sm text-muted-foreground" data-testid="partner-dashboard-tags-short-query">
            Enter at least 3 characters, or a tracking code (WH-) or token (R-).
          </p>
        ) : isLoading ? (
          <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading tag search results</span>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <QueryErrorState
            title="Could not search orders"
            message={getApiErrorMessage(error, 'Try again')}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : orders.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
            data-testid="partner-dashboard-tags-no-matches"
          >
            No matching orders. Check the number and try again.
          </p>
        ) : (
          <ul className="space-y-3" aria-live="polite">
            {orders.map((order) => (
              <li key={order.id}>
                <TagsSearchResultCard
                  order={order}
                  verifyExpanded={verifyOrderId === order.id}
                  onToggleVerify={() =>
                    setVerifyOrderId((current) => (current === order.id ? null : order.id))
                  }
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end border-t border-border/60 pt-3">
          <Link
            href="/partner/floor/print"
            className="min-h-11 inline-flex items-center text-sm font-medium text-primary hover:underline"
            data-testid="partner-dashboard-tags-open-print-center"
          >
            Open print center
          </Link>
        </div>
      </PartnerOpsSurface>
    </section>
  );
}
