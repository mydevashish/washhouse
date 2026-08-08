'use client';

import { cn } from '@/lib/utils';
import { usePartnerPracticeMode } from '@/features/partner-shop-floor/hooks/use-partner-practice-mode';

type PartnerPracticeModeToggleProps = {
  className?: string;
};

/**
 * Training flag for usability sessions. Does not mock APIs — use QA/staging seed
 * (see docs/qa/partner-shop-floor-usability.md).
 */
export function PartnerPracticeModeToggle({ className }: PartnerPracticeModeToggleProps) {
  const { enabled, hydrated, setEnabled } = usePartnerPracticeMode();

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="practice-mode-toggle">
      <div>
        <p className="text-sm font-semibold text-foreground">Practice mode</p>
        <p className="text-xs text-muted-foreground">
          Training banner on this device. Still uses real seed/staging data — not live
          customers. Checklist: docs/qa/partner-shop-floor-usability.md
        </p>
      </div>
      <button
        type="button"
        disabled={!hydrated}
        className={cn(
          'flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-60',
          enabled
            ? 'border-warning bg-warning-muted text-foreground'
            : 'border-border/60 text-foreground hover:bg-muted',
        )}
        aria-pressed={hydrated && enabled}
        data-testid="practice-mode-button"
        onClick={() => setEnabled(!enabled)}
      >
        <span className="text-sm font-semibold">{enabled ? 'Practice ON' : 'Practice OFF'}</span>
        <span className="text-xs text-muted-foreground">
          {enabled
            ? 'Amber banner visible — seed account only'
            : 'Tap to mark this tablet for training'}
        </span>
      </button>
    </div>
  );
}
