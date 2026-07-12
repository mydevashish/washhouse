import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export const WASHHOUSE_BRAND_NAME = 'The WashHouse Laundry & Dryclean';
export const WASHHOUSE_FULL_LOGO_SRC = '/brand/washhouse-logo.png';
export const WASHHOUSE_ICON_SRC = '/brand/washhouse-icon.png';

/**
 * Layout aspect ratios match the *ink* bounds of the PNGs (canvas has large
 * white padding). Paired with `object-cover` so reserved space ≈ visible mark
 * and CLS stays low. Explicit `w-*` (not only `w-auto`) avoids browsers using
 * the padded file aspect (~1.5) which collapses the wordmark to ~54px.
 */
/** Trimmed ink bounds of `washhouse-logo.png` (962×683, aspect ≈1.41). */
const FULL_LOGO_WIDTH = 962;
const FULL_LOGO_HEIGHT = 683;
/** Trimmed ink bounds of `washhouse-icon.png` (270×197, aspect ≈1.37). */
const ICON_WIDTH = 270;
const ICON_HEIGHT = 197;

export type WashhouseLogoProps = {
  variant?: 'full' | 'icon';
  className?: string;
  priority?: boolean;
  /**
   * When true (default), navbar-safe: icon below `sm`, medium wordmark `sm–lg`,
   * full wordmark `lg+`. Set false on auth/marketing heroes so the wordmark
   * always shows and scales with the viewport.
   */
  adaptive?: boolean;
  /** Slim navbar density — smaller mark, tighter crop. Does not affect auth heroes. */
  compact?: boolean;
  /** When set, wraps the logo in a Next.js `Link`. Defaults to `/discover`. */
  href?: string;
};

const linkClassName =
  'inline-flex shrink-0 items-center overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function IconLogoImage({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={WASHHOUSE_ICON_SRC}
      alt={WASHHOUSE_BRAND_NAME}
      width={ICON_WIDTH}
      height={ICON_HEIGHT}
      priority={priority}
      sizes="(max-width: 639px) 28px, (max-width: 1023px) 32px, 36px"
      className={cn(
        'h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8 lg:h-9 lg:w-9',
        className,
      )}
    />
  );
}

function AdaptiveFullLogo({
  className,
  priority,
  compact = false,
}: {
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        compact
          ? 'inline-flex h-6 shrink-0 items-center sm:h-7'
          : 'inline-flex h-7 shrink-0 items-center sm:h-8 lg:h-9 xl:h-10',
        className,
      )}
    >
      {/* Mobile (< sm): icon only — avoids navbar overflow at 375–414px.
          Only this branch gets `priority` so hidden wordmarks are not preloaded. */}
      <Image
        src={WASHHOUSE_ICON_SRC}
        alt={WASHHOUSE_BRAND_NAME}
        width={ICON_WIDTH}
        height={ICON_HEIGHT}
        priority={priority}
        sizes={compact ? '24px' : '28px'}
        className={cn(
          'shrink-0 object-contain sm:hidden',
          compact ? 'h-6 w-6' : 'h-7 w-7',
        )}
      />

      {/* Tablet (sm–lg): medium horizontal logo */}
      <Image
        src={WASHHOUSE_FULL_LOGO_SRC}
        alt={WASHHOUSE_BRAND_NAME}
        width={FULL_LOGO_WIDTH}
        height={FULL_LOGO_HEIGHT}
        sizes={compact ? '40px' : '46px'}
        className={cn(
          'hidden shrink-0 object-cover sm:block lg:hidden',
          compact ? 'h-6 w-[2.25rem] sm:h-7 sm:w-[2.5rem]' : 'h-8 w-[2.875rem]',
        )}
      />

      {/* Laptop / desktop (lg+): full logo */}
      <Image
        src={WASHHOUSE_FULL_LOGO_SRC}
        alt={WASHHOUSE_BRAND_NAME}
        width={FULL_LOGO_WIDTH}
        height={FULL_LOGO_HEIGHT}
        sizes={compact ? '40px' : '(min-width:1280px) 56px, 51px'}
        className={cn(
          'hidden shrink-0 object-cover lg:block',
          compact ? 'h-7 w-[2.5rem]' : 'h-9 w-[3.25rem] xl:h-10 xl:w-[3.5rem]',
        )}
      />
    </span>
  );
}

/** Always shows the wordmark; height/max-width scale across breakpoints (auth heroes). */
function StaticFullLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={WASHHOUSE_FULL_LOGO_SRC}
      alt={WASHHOUSE_BRAND_NAME}
      width={FULL_LOGO_WIDTH}
      height={FULL_LOGO_HEIGHT}
      priority={priority}
      sizes="(max-width: 639px) 52px, (max-width: 1023px) 64px, 68px"
      className={cn(
        // Explicit rem widths (not w-auto): padded PNG canvas is ~1.5:1, so
        // w-auto collapses to ~54px at h-9. Avoid min() in arbitrary values —
        // commas break Tailwind class generation; use max-w-full instead.
        'h-9 w-[3.25rem] max-w-full shrink-0 object-cover sm:h-11 sm:w-[4rem] lg:h-12 lg:w-[4.25rem]',
        className,
      )}
    />
  );
}

export function WashhouseLogo({
  variant = 'full',
  className,
  priority = false,
  adaptive = true,
  compact = false,
  href = '/discover',
}: WashhouseLogoProps) {
  const logo =
    variant === 'icon' ? (
      <IconLogoImage className={className} priority={priority} />
    ) : adaptive ? (
      <AdaptiveFullLogo className={className} priority={priority} compact={compact} />
    ) : (
      <StaticFullLogo className={className} priority={priority} />
    );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} className={linkClassName} aria-label={WASHHOUSE_BRAND_NAME}>
      {logo}
    </Link>
  );
}
