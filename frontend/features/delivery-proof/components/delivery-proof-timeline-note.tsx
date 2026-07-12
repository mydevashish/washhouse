'use client';

import { PackageCheck } from 'lucide-react';

import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import type { OrderStatusEvent } from '@/services/orders';
import { cn } from '@/lib/utils';

const DELIVERY_PROOF_NOTE = 'Delivery proof uploaded';

type DeliveryProofTimelineNoteProps = {
  events: OrderStatusEvent[];
  className?: string;
};

export function DeliveryProofTimelineNote({ events, className }: DeliveryProofTimelineNoteProps) {
  const noteEvent = events.find((e) => e.note === DELIVERY_PROOF_NOTE);
  if (!noteEvent) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3',
        className,
      )}
      role="status"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <PackageCheck className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{DELIVERY_PROOF_NOTE}</p>
        <time dateTime={noteEvent.created_at} className="text-sm text-muted-foreground">
          {formatOrderTimestamp(noteEvent.created_at)}
        </time>
      </div>
    </div>
  );
}

export { DELIVERY_PROOF_NOTE };
