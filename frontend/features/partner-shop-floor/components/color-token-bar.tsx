import { cn } from '@/lib/utils';
import {
  COLOR_TOKEN_HEX,
  COLOR_TOKEN_PATTERNS,
  colorTokenPatternCss,
  colorTokenPatternSize,
  isColorTokenKey,
  type ColorTokenKey,
} from '@/features/partner-shop-floor/lib/color-tokens';

type ColorTokenBarProps = {
  colorToken?: string | null;
  className?: string;
  /** Accessible name when used as a standalone graphic. */
  label?: string;
  /** Size variant for chip swatch vs print bar. */
  variant?: 'swatch' | 'bar';
};

/**
 * Color swatch/bar with stripe/dot overlay — color is never the only cue.
 */
export function ColorTokenBar({
  colorToken,
  className,
  label,
  variant = 'bar',
}: ColorTokenBarProps) {
  const key: ColorTokenKey | null = isColorTokenKey(colorToken) ? colorToken : null;
  const pattern = key ? COLOR_TOKEN_PATTERNS[key] : null;
  const hex = key ? COLOR_TOKEN_HEX[key] : '#6b7280';
  const patternCss = pattern ? colorTokenPatternCss(pattern) : undefined;
  const patternSize = pattern ? colorTokenPatternSize(pattern) : undefined;

  return (
    <span
      className={cn(
        'relative block overflow-hidden ring-1 ring-black/15',
        variant === 'swatch' && 'rounded-md',
        variant === 'bar' && 'w-full rounded-none',
        className,
      )}
      style={{ backgroundColor: hex }}
      data-testid="color-token-bar"
      data-color-token={key ?? 'unknown'}
      data-pattern={pattern ?? 'none'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {patternCss ? (
        <span
          className="absolute inset-0"
          style={{
            backgroundImage: patternCss,
            backgroundSize: patternSize,
          }}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
