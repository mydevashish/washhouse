'use client';

import { cn } from '@/lib/utils';
import { usePartnerUiMode } from '@/features/partner-shop-floor/hooks/use-partner-ui-mode';
import type { PartnerUiMode } from '@/features/partner-shop-floor/types';

const OPTIONS: { value: PartnerUiMode; label: string; hint: string }[] = [
  {
    value: 'shop_floor',
    label: 'Shop Floor',
    hint: '4 big buttons — counter staff',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    hint: 'Full dashboard & analytics',
  },
];

type PartnerUiModeToggleProps = {
  className?: string;
  /** Compact row for floor home footer */
  compact?: boolean;
};

export function PartnerUiModeToggle({ className, compact = false }: PartnerUiModeToggleProps) {
  const { mode, setMode, hydrated } = usePartnerUiMode();

  return (
    <div
      role="group"
      aria-label="Partner UI mode"
      className={cn(compact ? 'flex flex-col gap-1.5' : 'flex flex-col gap-2', className)}
    >
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-foreground">Display mode</p>
          <p className="text-xs text-muted-foreground">
            Saved on this device. Shop Floor is the default for counter work.
          </p>
        </div>
      )}
      <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        {OPTIONS.map(({ value, label, hint }) => {
          const selected = hydrated && mode === value;
          return (
            <button
              key={value}
              type="button"
              disabled={!hydrated}
              className={cn(
                'flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-60',
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/60 text-foreground hover:bg-muted',
              )}
              aria-pressed={selected}
              onClick={() => setMode(value)}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
