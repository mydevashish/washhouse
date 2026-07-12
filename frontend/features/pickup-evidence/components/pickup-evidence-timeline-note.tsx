'use client';

import { Camera } from 'lucide-react';

import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import type { OrderStatusEvent } from '@/services/orders';
import { cn } from '@/lib/utils';

const PICKUP_PHOTOS_NOTE = 'Pickup photos uploaded';

type PickupEvidenceTimelineNoteProps = {
  events: OrderStatusEvent[];
  className?: string;
};

export function PickupEvidenceTimelineNote({ events, className }: PickupEvidenceTimelineNoteProps) {
  const noteEvent = events.find((e) => e.note === PICKUP_PHOTOS_NOTE);
  if (!noteEvent) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3',
        className,
      )}
      role="status"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Camera className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{PICKUP_PHOTOS_NOTE}</p>
        <time dateTime={noteEvent.created_at} className="text-sm text-muted-foreground">
          {formatOrderTimestamp(noteEvent.created_at)}
        </time>
      </div>
    </div>
  );
}

export { PICKUP_PHOTOS_NOTE };
