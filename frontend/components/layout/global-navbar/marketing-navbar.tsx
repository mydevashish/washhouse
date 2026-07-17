'use client';

import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import {
  NavbarThemeInline,
  NavbarThemeToggle,
} from '@/components/layout/global-navbar/navbar-theme-toggle';
import { scrollToHash } from '@/components/navigation/hash-scroll-handler';
import { Button } from '@/components/ui/button';
import {
  buildTelHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import {
  getSamePageHash,
  isMarketingNavLinkActive,
  MARKETING_BOOK_NOW_HREF,
  MARKETING_NAV_LINKS,
  MARKETING_STAFF_HREF,
} from '@/lib/navigation/marketing-nav';
import { cn } from '@/lib/utils';

const telHref = buildTelHref(CONTACT_CONFIG.phone);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useHash(): [string, () => void] {
  const [hash, setHash] = useState('');

  const readHash = useCallback(() => {
    const value = window.location.hash.replace(/^#/, '');
    setHash(value);
    return value;
  }, []);

  useEffect(() => {
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [readHash]);

  return [hash, readHash];
}

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );

    const previouslyFocused = document.activeElement as HTMLElement | null;
    getFocusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onEscape]);
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const [currentHash, readHash] = useHash();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useFocusTrap(mobileNavRef, mobileOpen, closeMobile);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    // Soft-nav / bfcache can leave a stuck body lock if menu was open mid-navigation.
    document.body.style.overflow = '';
  }, [pathname]);

  useEffect(() => {
    readHash();
  }, [pathname, readHash]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /** Same-page hash only — cross-page links use native anchors for reliable navigation. */
  const handleSamePageHashClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      const hash = getSamePageHash(pathname, href);
      if (!hash || !scrollToHash(hash)) return;
      event.preventDefault();
      window.history.pushState(null, '', href);
      readHash();
    },
    [pathname, readHash],
  );

  const navLinkClassName = (active: boolean) =>
    cn(
      'shrink-0 rounded-md px-2 py-1.5 text-xs font-medium transition-colors lg:px-2.5 lg:py-2 lg:text-sm xl:px-3',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      active ? 'text-primary' : 'text-foreground hover:text-foreground',
    );

  const mobileLinkClassName = (active: boolean) =>
    cn(
      'flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors',
      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
    );

  const renderNavAnchor = (
    href: string,
    label: string,
    className: string,
    active: boolean,
    options?: { closeOnNavigate?: boolean },
  ) => {
    const samePageHash = getSamePageHash(pathname, href);
    const closeOnNavigate = options?.closeOnNavigate ?? false;
    return (
      <a
        key={href}
        href={href}
        onClick={
          samePageHash || closeOnNavigate
            ? (event) => {
                if (samePageHash) {
                  handleSamePageHashClick(event, href);
                }
                if (closeOnNavigate) {
                  closeMobile();
                }
              }
            : undefined
        }
        className={className}
        aria-current={active ? 'page' : undefined}
      >
        {label}
      </a>
    );
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 isolate w-full min-w-0 max-w-full border-b bg-background transition-[box-shadow,border-color] duration-base',
        scrolled ? 'border-border shadow-md' : 'border-border/60 shadow-sm',
      )}
    >
      <div className="mx-auto flex h-nav w-full min-w-0 max-w-[1440px] items-center gap-2 px-4 sm:gap-2.5 sm:px-6 lg:gap-3 lg:px-8">
        <WashhouseLogo href="/" priority compact className="shrink-0" />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Main navigation"
        >
          {MARKETING_NAV_LINKS.map(({ href, label }) => {
            const active = isMarketingNavLinkActive(pathname, href, currentHash);
            return renderNavAnchor(href, label, navLinkClassName(active), active);
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden lg:block">
            <NavbarThemeToggle />
          </div>
          <div className="hidden shrink-0 items-center gap-1 sm:flex sm:gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full px-3 font-medium text-foreground hover:text-foreground"
            >
              <a href={MARKETING_STAFF_HREF}>Staff login</a>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4 font-semibold">
              <a
                href={MARKETING_BOOK_NOW_HREF}
                onClick={
                  getSamePageHash(pathname, MARKETING_BOOK_NOW_HREF)
                    ? (event) => handleSamePageHashClick(event, MARKETING_BOOK_NOW_HREF)
                    : undefined
                }
              >
                Book Now
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden rounded-full border-success/60 px-4 font-semibold text-success hover:bg-success/10 hover:text-success xl:inline-flex"
            >
              <a href={telHref}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                Call Now
              </a>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          ref={mobileNavRef}
          id="marketing-mobile-nav"
          className="border-t border-border/60 bg-background px-4 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-1">
            {MARKETING_NAV_LINKS.map(({ href, label }) => {
              const active = isMarketingNavLinkActive(pathname, href, currentHash);
              return (
                <li key={href}>
                  {renderNavAnchor(href, label, mobileLinkClassName(active), active, {
                    closeOnNavigate: true,
                  })}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-border/60 px-1 pt-4">
            <NavbarThemeInline />
          </div>

          <div className="mt-4 border-t border-border/60 pt-4">
            <a
              href={MARKETING_STAFF_HREF}
              onClick={closeMobile}
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Staff login
            </a>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:hidden">
            <Button asChild className="w-full rounded-full font-semibold">
              <a
                href={MARKETING_BOOK_NOW_HREF}
                onClick={(event) => {
                  if (getSamePageHash(pathname, MARKETING_BOOK_NOW_HREF)) {
                    handleSamePageHashClick(event, MARKETING_BOOK_NOW_HREF);
                  }
                  closeMobile();
                }}
              >
                Book Now
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-success/60 font-semibold text-success hover:bg-success/10 hover:text-success"
            >
              <a href={telHref} onClick={closeMobile}>
                <Phone className="h-4 w-4" aria-hidden />
                Call Now
              </a>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
