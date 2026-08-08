'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

import {
  floorCoachCopy,
  readCoachOrderCount,
  shouldShowFloorCoach,
  type FloorCoachStep,
} from '@/features/partner-shop-floor/lib/floor-coach';
import { PARTNER_FLOOR_COACH_ORDER_LIMIT } from '@/features/partner-shop-floor/types';
import { cn } from '@/lib/utils';

type FloorCoachMarkProps = {
  step: FloorCoachStep;
  className?: string;
  /** Force-hide for tests / Advanced. */
  forceHide?: boolean;
};

/**
 * Sticky “Show my next step” coach — only for the first 3 successful creates
 * on this device (`dlm.partner_floor_coach_orders`).
 */
export function FloorCoachMark({ step, className, forceHide }: FloorCoachMarkProps) {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(readCoachOrderCount());
  }, []);

  // Re-read when step changes (after success increments storage).
  useEffect(() => {
    if (!mounted) return;
    setCount(readCoachOrderCount());
  }, [mounted, step]);

  if (forceHide || !mounted || dismissed || !shouldShowFloorCoach(count)) {
    return null;
  }

  const copy = floorCoachCopy(step);
  const remaining = Math.max(0, PARTNER_FLOOR_COACH_ORDER_LIMIT - count);

  return (
    <aside
      className={cn(
        'sticky bottom-20 z-30 mx-auto w-full max-w-lg px-3 sm:bottom-4',
        'print:hidden',
        className,
      )}
      data-testid="floor-coach-mark"
      aria-live="polite"
    >
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border-2 border-primary/40 bg-card px-3 py-3 shadow-soft',
          'ring-1 ring-border/40',
        )}
      >
        <Lightbulb className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Show my next step
          </p>
          <p className="mt-0.5 text-base font-semibold leading-snug text-foreground">
            {copy.english}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tip shows for the first {PARTNER_FLOOR_COACH_ORDER_LIMIT} orders — {remaining} left
          </p>
        </div>
        <button
          type="button"
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            'text-muted-foreground outline-none hover:bg-muted',
            'focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label="Dismiss coach tip"
          onClick={() => setDismissed(true)}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
