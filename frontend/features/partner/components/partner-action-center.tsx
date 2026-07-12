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
            <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                <Link href="/partner/orders" className="mt-1 inline-block text-xs text-primary hover:underline">
                  #{item.trackingCode}
                </Link>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {item.primaryAction === 'accept' && (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      className="min-w-[100px]"
                      disabled={busy}
                      onClick={() => acceptMutation.mutate(item.orderId)}
                    >
                      {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="min-w-[100px]"
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
                    size="lg"
                    className="min-w-[140px]"
                    disabled={busy}
                    onClick={() => advanceOrder(item.orderId, item.status, item.orderSource)}
                  >
                    {getPartnerAdvanceLabel(item.status, item.orderSource) ?? 'Next step'}
                  </Button>
                )}
                {item.primaryAction === 'view' && (
                  <Button type="button" size="lg" variant="secondary" asChild>
                    <Link href="/partner/orders">View order</Link>
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
