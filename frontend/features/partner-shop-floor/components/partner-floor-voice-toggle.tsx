'use client';

import { cn } from '@/lib/utils';
import { usePartnerFloorVoice } from '@/features/partner-shop-floor/hooks/use-partner-floor-voice';

type PartnerFloorVoiceToggleProps = {
  className?: string;
};

/**
 * Opt-in Web Speech prompts for order success / print.
 * Off by default; English (en-IN); never speaks when reduced-motion or sound-off.
 */
export function PartnerFloorVoiceToggle({ className }: PartnerFloorVoiceToggleProps) {
  const { enabled, soundOff, hydrated, setEnabled, setSoundOff } = usePartnerFloorVoice();

  return (
    <div className={cn('flex flex-col gap-3', className)} data-testid="floor-voice-toggle">
      <div>
        <p className="text-sm font-semibold text-foreground">Voice prompts</p>
        <p className="text-xs text-muted-foreground">
          Optional English (India) one-line speak on order save / print. Respects reduced motion.
          Default OFF.
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
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-border/60 text-foreground hover:bg-muted',
        )}
        aria-pressed={hydrated && enabled}
        data-testid="floor-voice-button"
        onClick={() => setEnabled(!enabled)}
      >
        <span className="text-sm font-semibold">
          {enabled ? 'Voice prompts ON' : 'Voice prompts OFF'}
        </span>
        <span className="text-xs text-muted-foreground">
          {enabled ? 'Speaks a short English line on success / print' : 'Tap to enable Web Speech'}
        </span>
      </button>
      <button
        type="button"
        disabled={!hydrated}
        className={cn(
          'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-60',
          soundOff ? 'border-warning bg-warning-muted/50' : 'border-border/50 hover:bg-muted/60',
        )}
        aria-pressed={hydrated && soundOff}
        data-testid="floor-sound-off-button"
        onClick={() => setSoundOff(!soundOff)}
      >
        <span className="text-sm font-semibold">{soundOff ? 'Sound OFF' : 'Sound on (default)'}</span>
        <span className="text-xs text-muted-foreground">
          {soundOff ? 'Voice blocked even if prompts ON' : 'Mute speech without clearing the setting'}
        </span>
      </button>
    </div>
  );
}
