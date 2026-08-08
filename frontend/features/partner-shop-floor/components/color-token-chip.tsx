import { cn } from '@/lib/utils';
import { ColorTokenBar } from '@/features/partner-shop-floor/components/color-token-bar';
import {
  COLOR_TOKEN_LABELS,
  isColorTokenKey,
  type ColorTokenKey,
} from '@/features/partner-shop-floor/lib/color-tokens';

type ColorTokenChipProps = {
  colorToken?: string | null;
  tokenCode?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
};

export function ColorTokenChip({
  colorToken,
  tokenCode,
  size = 'md',
  className,
  showLabel = false,
}: ColorTokenChipProps) {
  if (!tokenCode && !colorToken) return null;
  const key = isColorTokenKey(colorToken) ? colorToken : null;
  const labels = key ? COLOR_TOKEN_LABELS[key] : null;
  const a11yLabel = [
    tokenCode,
    labels ? `${labels.hinglish} / ${labels.en}` : null,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg bg-muted/60 font-semibold tabular-nums text-foreground',
        size === 'sm' && 'px-1.5 py-0.5 text-xs',
        size === 'md' && 'px-2 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5 text-lg',
        className,
      )}
      data-testid="color-token-chip"
      title={labels ? `${labels.hinglish} / ${labels.en}` : tokenCode ?? undefined}
      aria-label={a11yLabel || undefined}
    >
      <ColorTokenBar
        colorToken={colorToken}
        variant="swatch"
        className={cn(
          'shrink-0',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-6 w-6',
          !key && 'bg-muted-foreground',
        )}
      />
      <span className="font-mono tracking-tight" aria-hidden>
        {tokenCode ?? '—'}
      </span>
      {showLabel && labels ? (
        <span className="font-sans text-xs font-normal text-muted-foreground" aria-hidden>
          {labels.hinglish}
        </span>
      ) : null}
    </span>
  );
}

// Keep type export path stable for callers that imported ColorTokenKey via chip historically.
export type { ColorTokenKey };
