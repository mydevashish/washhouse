'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import type { AttentionItem } from '@/features/partner/lib/partner-derive';
import { getPartnerAdvanceLabel } from '@/features/partner/lib/partner-status';
import { usePartnerOrderMutations } from '@/features/partner/hooks/use-partner-operations';

type PartnerActionCenterProps = {
  items: AttentionItem[];
};

export function PartnerActionCenter({ items }: PartnerActionCenterProps) {
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation } = usePartnerOrderMutations();

  if (!items.length) {
    return (
      <PartnerPanel title="Needs attention" description="All caught up">
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No urgent tasks right now. New orders and pickups will show here.
        </p>
      </PartnerPanel>
    );
  }

  return (
    <PartnerPanel title="Needs attention" meta={`${items.length} item${items.length !== 1 ? 's' : ''}`}>
      <ul className="divide-y divide-border/50">
        {items.map((item) => {
          const busy =
            acceptMutation.isPending ||
            rejectMutation.isPending ||
            advanceMutation.isPending;
          return (
            <li key={item.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                <Link
                  href={`/partner/orders/${item.orderId}`}
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  #{item.trackingCode}
                </Link>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {item.primaryAction === 'accept' && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 px-3"
                      disabled={busy}
                      onClick={() => acceptMutation.mutate(item.orderId)}
                    >
                      {acceptMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 px-3"
                      disabled={busy}
                      onClick={() => rejectMutation.mutate(item.orderId)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {item.primaryAction === 'advance' && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3"
                    disabled={busy}
                    onClick={() => advanceOrder(item.orderId, item.status, item.orderSource)}
                  >
                    {advanceMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      (getPartnerAdvanceLabel(item.status, item.orderSource) ?? 'Next step')
                    )}
                  </Button>
                )}
                {item.primaryAction === 'view' && (
                  <Button type="button" size="sm" variant="secondary" className="h-9 px-3" asChild>
                    <Link href={`/partner/orders/${item.orderId}`}>View order</Link>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </PartnerPanel>
  );
}
