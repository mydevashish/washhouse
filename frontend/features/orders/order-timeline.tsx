'use client';

import { Check } from 'lucide-react';

import type { TimelineStep } from '@/features/orders/lib/order-status-meta';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import { cn } from '@/lib/utils';

type OrderTimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

export function OrderTimeline({ steps, className }: OrderTimelineProps) {
  if (!steps.length) return null;

  return (
    <ol className={cn('relative', className)} aria-label="Order status timeline">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;
        const isComplete = step.state === 'complete';
        const isCurrent = step.state === 'current';

        return (
          <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[1.25rem] top-11 -ml-px h-[calc(100%-1.75rem)] w-0.5',
                  isComplete ? 'bg-gradient-to-b from-primary to-sky-400' : 'bg-border',
                )}
                aria-hidden
              />
            )}

            <div className="relative z-10 shrink-0">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors shadow-sm',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isCurrent &&
                    'border-primary bg-primary/10 text-primary ring-4 ring-primary/20 shadow-md',
                  step.state === 'upcoming' &&
                    'border-border bg-card text-muted-foreground',
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden />
                )}
              </span>
              {isCurrent && (
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-primary/20"
                  aria-hidden
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <p
                  className={cn(
                    'font-semibold',
                    isCurrent ? 'text-foreground' : 'text-foreground/90',
                    step.state === 'upcoming' && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Now
                    </span>
                  )}
                </p>
              </div>

              {step.timestamp ? (
                <time
                  dateTime={step.timestamp}
                  className="mt-1 block text-sm tabular-nums text-muted-foreground"
                >
                  {formatOrderTimestamp(step.timestamp)}
                </time>
              ) : isCurrent ? (
                <p className="mt-1 text-sm text-primary">In progress</p>
              ) : step.state === 'upcoming' ? (
                <p className="mt-1 text-sm text-muted-foreground">Upcoming</p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              )}

              {isCurrent && step.timestamp && (
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
