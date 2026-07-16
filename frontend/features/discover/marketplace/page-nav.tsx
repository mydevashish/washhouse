'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { scrollToHash } from '@/components/navigation/hash-scroll-handler';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import {
  DISCOVER_SECTION_NAV_LINKS,
  DISCOVER_SECTION_IDS,
  isDiscoverSectionNavLinkActive,
  resolveDiscoverActiveSection,
} from '@/lib/navigation/discover-nav';
import { getSamePageHash } from '@/lib/navigation/nav-active';
import { useLocationHash } from '@/lib/navigation/use-location-hash';
import { useSectionScrollSpy } from '@/lib/navigation/use-section-scroll-spy';
import { cn } from '@/lib/utils';

export function MarketplacePageNav() {
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();
  const [currentHash, readHash] = useLocationHash();
  const scrollSpySectionId = useSectionScrollSpy(DISCOVER_SECTION_IDS, {
    enabled: pathname === '/discover',
    rootMargin: '-30% 0px -55% 0px',
  });

  const activeSectionId = useMemo(
    () => resolveDiscoverActiveSection(scrollSpySectionId, currentHash),
    [scrollSpySectionId, currentHash],
  );

  useEffect(() => {
    readHash();
  }, [pathname, readHash]);

  if (pathname !== '/discover') return null;

  const handleSamePageHashClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      const hash = getSamePageHash(pathname, href);
      if (!hash || !scrollToHash(hash, reduceMotion ? 'auto' : 'smooth')) return;
      event.preventDefault();
      window.history.pushState(null, '', href);
      readHash();
    },
    [pathname, readHash, reduceMotion],
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav
        aria-label="Page sections"
        className="sticky top-14 z-30 hidden border-b border-border bg-bg-0/95 backdrop-blur lg:block"
      >
        <div className="container flex h-11 items-center gap-1 overflow-x-auto">
          {DISCOVER_SECTION_NAV_LINKS.map((item) => {
            const active = isDiscoverSectionNavLinkActive(pathname, item.href, activeSectionId);
            const samePageHash = getSamePageHash(pathname, item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={
                  samePageHash
                    ? (event) => handleSamePageHashClick(event, item.href)
                    : undefined
                }
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  active
                    ? 'bg-bg-1 font-semibold text-brand-500'
                    : 'text-fg-1 hover:bg-bg-1 hover:text-brand-500',
                )}
                aria-current={active ? 'true' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
