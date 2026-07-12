'use client';

import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import { DISPUTE_STATUS_LABELS, type DisputeStatusEvent } from '@/services/disputes';
import { cn } from '@/lib/utils';

type DisputeStatusTimelineProps = {
  events: DisputeStatusEvent[];
  className?: string;
};

export function DisputeStatusTimeline({ events, className }: DisputeStatusTimelineProps) {
  if (!events.length) return null;

  return (
    <ol className={cn('space-y-4', className)} aria-label="Dispute status history">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span className="absolute left-[0.55rem] top-6 h-[calc(100%-0.5rem)] w-0.5 bg-border" aria-hidden />
            )}
            <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {event.status_label || DISPUTE_STATUS_LABELS[event.status] || event.status}
              </p>
              <time dateTime={event.created_at} className="text-sm text-muted-foreground">
                {formatOrderTimestamp(event.created_at)}
              </time>
              {(event.actor_name || event.note) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.actor_name && <span>{event.actor_name}</span>}
                  {event.note && <span>{event.actor_name ? ' — ' : ''}{event.note}</span>}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
