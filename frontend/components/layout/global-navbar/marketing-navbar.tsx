'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import {
  buildTelHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import {
  MARKETING_BOOK_NOW_HREF,
  MARKETING_NAV_LINKS,
  MARKETING_STAFF_HREF,
} from '@/lib/navigation/marketing-nav';
import { cn } from '@/lib/utils';

const telHref = buildTelHref(CONTACT_CONFIG.phone);

function isNavLinkActive(pathname: string, href: string): boolean {
  const [path, hash] = href.split('#');
  if (hash) return pathname === path;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 isolate w-full border-b bg-background transition-[box-shadow,border-color] duration-base',
        scrolled
          ? 'border-border shadow-md'
          : 'border-border/60 shadow-sm',
      )}
    >
      <div className="mx-auto flex h-nav max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <WashhouseLogo href="/" priority compact className="shrink-0" />

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {MARKETING_NAV_LINKS.map(({ href, label }) => {
            const active = isNavLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'text-primary'
                    : 'text-foreground hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full px-3 font-medium text-foreground hover:text-foreground"
            >
              <Link href={MARKETING_STAFF_HREF}>Staff login</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4 font-semibold">
              <Link href={MARKETING_BOOK_NOW_HREF}>Book Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-success/60 px-4 font-semibold text-success hover:bg-success/10 hover:text-success"
            >
              <a href={telHref}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                Call Now
              </a>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
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
          id="marketing-mobile-nav"
          className="border-t border-border/60 bg-background px-4 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-1">
            {MARKETING_NAV_LINKS.map(({ href, label }) => {
              const active = isNavLinkActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      'flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-border/60 pt-4">
            <Link
              href={MARKETING_STAFF_HREF}
              onClick={closeMobile}
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Staff login
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:hidden">
            <Button asChild className="w-full rounded-full font-semibold">
              <Link href={MARKETING_BOOK_NOW_HREF} onClick={closeMobile}>
                Book Now
              </Link>
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
