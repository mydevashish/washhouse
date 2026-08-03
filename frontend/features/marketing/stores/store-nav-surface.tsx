'use client';

import Link from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';

/**
 * TODO: re-enable store navigation when ready —
 * set `STORE_NAVIGATION_ENABLED` to `true` (or delete this gate).
 *
 * Temporary UX: cover/name must not navigate to `/discover/[id]` at any breakpoint.
 * Contact actions stay outside this surface.
 */
export const STORE_NAVIGATION_ENABLED = false;

type StoreNavSurfaceProps = {
  href: string;
  /** Accessible name when the surface is a link (when nav is re-enabled). */
  ariaLabel: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
};

/**
 * Marketing store cover/name surface.
 * When navigation is disabled: non-navigable visual only (no link in the a11y tree).
 * When re-enabled: storefront Link wrapping the surface.
 */
export function StoreNavSurface({
  href,
  ariaLabel,
  className,
  onClick,
  children,
}: StoreNavSurfaceProps) {
  if (STORE_NAVIGATION_ENABLED) {
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

  return <div className={className}>{children}</div>;
}
