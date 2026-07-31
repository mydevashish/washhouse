'use client';

import Link from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * TODO: re-enable store navigation on mobile when ready —
 * set `STORE_NAVIGATION_ENABLED_BELOW_LG` to `true` (or delete this gate).
 *
 * Temporary UX: cover/name must not navigate to `/discover/[id]` below Tailwind `lg`
 * (< 1024px). Desktop `lg+` keeps Link behavior. Contact actions stay outside this surface.
 */
export const STORE_NAVIGATION_ENABLED_BELOW_LG = false;

type StoreNavSurfaceProps = {
  href: string;
  /** Accessible name when the surface is a link (desktop / when below-lg nav is re-enabled). */
  ariaLabel: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
};

/**
 * Marketing store cover/name surface.
 * Below `lg`: non-navigable visual only (no link in the a11y tree).
 * From `lg` up: storefront Link (full-surface overlay, or whole wrapper when below-lg nav is on).
 */
export function StoreNavSurface({
  href,
  ariaLabel,
  className,
  onClick,
  children,
}: StoreNavSurfaceProps) {
  if (STORE_NAVIGATION_ENABLED_BELOW_LG) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      {/* Desktop lg+ only — `max-lg:hidden` removes from a11y/tab order below lg */}
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'absolute inset-0 z-10 max-lg:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        )}
        aria-label={ariaLabel}
      />
    </div>
  );
}
