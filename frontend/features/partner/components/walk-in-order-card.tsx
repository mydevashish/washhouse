'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClientDate } from '@/components/ui/client-date';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  getWalkInActionLabel,
  getWalkInNextStatus,
  isWalkInOrderActive,
} from '@/features/partner/lib/partner-status';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';
import { cn } from '@/lib/utils';

type WalkInOrderCardProps = {
  order: WalkInOrder;
  onAdvance: () => void;
  isAdvancing?: boolean;
};

export function WalkInOrderCard({ order, onAdvance, isAdvancing }: WalkInOrderCardProps) {
  const nextLabel = getWalkInActionLabel(order.status);
  const nextStatus = getWalkInNextStatus(order.status);
  const active = isWalkInOrderActive(order.status);

  return (
    <Card className={cn(order.status === 'cancelled' && 'opacity-70')}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-foreground">#{order.tracking_code}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">{order.customer_name}</p>
            <p className="truncate text-sm text-muted-foreground">{order.customer_phone}</p>
          </div>
          <PartnerStatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{formatInr(Number(order.total_inr))}</strong> total
          </span>
          <span>
            Ready by{' '}
            <ClientDate iso={order.expected_ready_at ?? order.delivery_at} mode="datetime" />
          </span>
        </div>

        {order.items.length > 0 && (
          <ul className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.service_name} × {item.quantity}
              </li>
            ))}
          </ul>
        )}

        {order.partner_notes && (
          <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {order.partner_notes}
          </p>
        )}

        {active && nextStatus && nextLabel && (
          <Button
            type="button"
            className="min-h-[44px] w-full"
            disabled={isAdvancing}
            onClick={onAdvance}
          >
            {isAdvancing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : nextLabel}
          </Button>
        )}

        {order.status === 'delivered' && (
          <p className="text-center text-sm font-medium text-success">Collected / delivered</p>
        )}
      </CardContent>
    </Card>
  );
}
