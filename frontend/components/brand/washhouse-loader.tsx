import Image from 'next/image';

import { WASHHOUSE_ICON_SRC } from '@/components/brand/washhouse-logo';
import { cn } from '@/lib/utils';

export type WashhouseLoaderSize = 'sm' | 'md' | 'lg';
export type WashhouseLoaderVariant = 'pulse' | 'breathe' | 'ring';

export type WashhouseLoaderProps = {
  size?: WashhouseLoaderSize;
  label?: string;
  showLabel?: boolean;
  className?: string;
  variant?: WashhouseLoaderVariant;
  /** Rising bubble dots above the icon (logo motif). CSS-only. */
  bubbles?: boolean;
};

const SIZE_PX: Record<WashhouseLoaderSize, number> = {
  sm: 24,
  md: 36,
  lg: 52,
};

const SIZE_CLASS: Record<WashhouseLoaderSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-[3.25rem] w-[3.25rem]',
};

const RING_PAD: Record<WashhouseLoaderSize, string> = {
  sm: 'p-0.5',
  md: 'p-1',
  lg: 'p-1.5',
};

const BUBBLE_WRAP: Record<WashhouseLoaderSize, string> = {
  sm: 'mb-0.5 h-2',
  md: 'mb-1 h-3',
  lg: 'mb-1.5 h-4',
};

const BUBBLE_DOT: Record<WashhouseLoaderSize, string> = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const ICON_MOTION: Record<WashhouseLoaderVariant, string> = {
  pulse: 'animate-washhouse-pulse motion-reduce:animate-none',
  breathe: 'animate-washhouse-breathe motion-reduce:animate-none',
  ring: '',
};

const BUBBLE_DELAYS = ['0ms', '280ms', '560ms'] as const;

/**
 * Branded loading indicator using the WashHouse W icon.
 * CSS/Tailwind only — transform + opacity; respects prefers-reduced-motion.
 */
export function WashhouseLoader({
  size = 'md',
  label = 'Loading…',
  showLabel = true,
  className,
  variant = 'pulse',
  bubbles = true,
}: WashhouseLoaderProps) {
  const px = SIZE_PX[size];
  const iconClass = SIZE_CLASS[size];

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center gap-2',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-atomic="true"
    >
      <div className="relative inline-flex flex-col items-center">
        {bubbles ? (
          <div
            aria-hidden
            className={cn(
              'relative flex w-full items-end justify-center gap-1',
              BUBBLE_WRAP[size],
            )}
          >
            {BUBBLE_DELAYS.map((delay, i) => (
              <span
                key={delay}
                className={cn(
                  'rounded-full bg-gradient-to-br from-brand-700 to-sky-500',
                  'animate-washhouse-bubble-rise motion-reduce:animate-none',
                  'motion-reduce:opacity-80',
                  BUBBLE_DOT[size],
                  i === 1 && 'mb-0.5',
                  i === 2 && 'mb-1',
                )}
                style={{ animationDelay: delay }}
              />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
            'bg-white/95 dark:bg-white/90',
            RING_PAD[size],
            'will-change-transform motion-reduce:will-change-auto',
            ICON_MOTION[variant],
          )}
        >
          {variant === 'ring' ? (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute -inset-1 rounded-full',
                'bg-[conic-gradient(from_0deg,transparent_0%,transparent_35%,var(--brand-700)_55%,var(--sky-500)_72%,transparent_88%)]',
                'opacity-70 motion-reduce:opacity-40',
                'animate-washhouse-ring-spin motion-reduce:animate-none',
                'will-change-transform motion-reduce:will-change-auto',
                '[mask:radial-gradient(farthest-side,transparent_calc(100%-2.5px),#000_calc(100%-2.5px))]',
              )}
            />
          ) : null}

          <Image
            src={WASHHOUSE_ICON_SRC}
            alt=""
            width={270}
            height={197}
            sizes={`${px}px`}
            className={cn(
              'relative z-[1] shrink-0 object-contain',
              iconClass,
            )}
            aria-hidden
          />
        </div>
      </div>

      {showLabel ? (
        <p className="font-sans text-sm font-medium text-muted-foreground">{label}</p>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}
