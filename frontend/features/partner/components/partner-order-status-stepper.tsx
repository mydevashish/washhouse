'use client';

import { Check } from 'lucide-react';

import {
  TRACKING_STATUS_ORDER,
  getOrderStatusLabel,
} from '@/features/orders/lib/order-status-meta';
import { cn } from '@/lib/utils';

const WALK_IN_STEPS = ['confirmed', 'washing', 'ready', 'delivered'] as const;

type PartnerOrderStatusStepperProps = {
  currentStatus: string;
  orderSource?: 'online' | 'walk_in' | null;
};

export function PartnerOrderStatusStepper({
  currentStatus,
  orderSource,
}: PartnerOrderStatusStepperProps) {
  const steps =
    orderSource === 'walk_in'
      ? [...WALK_IN_STEPS]
      : [...TRACKING_STATUS_ORDER];

  if (currentStatus === 'cancelled') {
    return (
      <div
        className="rounded-lg bg-danger-muted/40 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/30"
        role="status"
      >
        Order cancelled
      </div>
    );
  }

  const currentIndex = steps.indexOf(currentStatus as (typeof steps)[number]);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <ol
      className="flex gap-1 overflow-x-auto pb-1"
      aria-label="Order status progress"
    >
      {steps.map((status, index) => {
        const complete = index < safeIndex;
        const current = index === safeIndex;
        const upcoming = index > safeIndex;
        return (
          <li
            key={status}
            className={cn(
              'flex min-w-[88px] flex-1 flex-col items-center gap-1.5 px-1',
              upcoming && 'opacity-50',
            )}
          >
            <div className="flex w-full items-center">
              {index > 0 && (
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full',
                    complete || current ? 'bg-success' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-2',
                  complete && 'bg-success text-success-foreground ring-success/30',
                  current && 'bg-primary text-primary-foreground ring-primary/30',
                  upcoming && 'bg-muted text-muted-foreground ring-border',
                )}
                aria-current={current ? 'step' : undefined}
              >
                {complete ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full',
                    complete ? 'bg-success' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </div>
            <span
              className={cn(
                'text-center text-[10px] font-medium leading-tight',
                current ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {getOrderStatusLabel(status)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
