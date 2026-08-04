'use client';

import { ChevronRight, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CustomerDeskProfile } from '@/features/partner/customer-desk/types';

type Props = {
  results: CustomerDeskProfile[];
  isLoading?: boolean;
  query?: string;
  onSelect: (profile: CustomerDeskProfile) => void;
};

function formatLastOrder(iso: string | null): string {
  if (!iso) return 'No orders yet';
  try {
    return `Last order ${new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  } catch {
    return 'Last order —';
  }
}

export function PartnerCustomerDeskResults({ results, isLoading, query, onSelect }: Props) {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Searching…
      </p>
    );
  }

  if (!query) return null;

  if (results.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">
          No customer at your laundry matched{' '}
          <span className="font-medium text-foreground">“{query}”</span>. Try their phone to start
          a new order.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="divide-y divide-border rounded-lg border border-border"
      role="listbox"
      aria-label="Search results"
    >
      {results.map((row) => (
        <li key={row.phone || row.user_id || row.name || 'row'}>
          <button
            type="button"
            role="option"
            className="flex w-full min-h-[44px] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onSelect(row)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium">{row.name || 'Unknown name'}</span>
                {row.registered ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Registered
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Guest
                  </Badge>
                )}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                {row.phone}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {row.order_count} order{row.order_count === 1 ? '' : 's'} ·{' '}
                {formatLastOrder(row.last_order_at)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
