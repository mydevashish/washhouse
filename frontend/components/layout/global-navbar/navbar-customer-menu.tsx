'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { NavbarThemeInline } from '@/components/layout/global-navbar/navbar-theme-toggle';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  MARKETING_NAV_LINKS,
  MARKETING_STAFF_HREF,
  isMarketingNavLinkActive,
} from '@/lib/navigation/marketing-nav';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Marketing-style hamburger for the customer app shell so every page
 * (Discover, laundry shop, Orders, Account) exposes the same menu entry —
 * including Sign in for guests.
 */
export function NavbarCustomerMenu() {
  const pathname = usePathname();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const container = panelRef.current;
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );

    const previouslyFocused = document.activeElement as HTMLElement | null;
    getFocusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
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
  }, [open, close]);

  const linkClass = (active: boolean) =>
    cn(
      'flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors',
      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
    );

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-black/20"
              aria-label="Dismiss menu"
              onClick={close}
            />
            <nav
              ref={panelRef}
              id={panelId}
              className="fixed inset-x-0 top-[var(--nav-height)] z-[70] max-h-[calc(100dvh-var(--nav-height))] overflow-y-auto border-b border-border/60 bg-background px-4 py-4 shadow-lg"
              aria-label="Site menu"
            >
              <ul className="space-y-0.5">
                {MARKETING_NAV_LINKS.map(({ href, label }) => {
                  const active = isMarketingNavLinkActive(pathname, href, '');
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={linkClass(active)}
                        aria-current={active ? 'page' : undefined}
                        onClick={close}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 border-t border-border/60 px-1 pt-3">
                <NavbarThemeInline />
              </div>

              <div className="mt-3 space-y-0.5 border-t border-border/60 pt-3">
                {!user ? (
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                    onClick={close}
                  >
                    Sign in
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                    onClick={close}
                  >
                    Account
                  </Link>
                )}
                <Link
                  href={MARKETING_STAFF_HREF}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-foreground hover:bg-muted"
                  onClick={close}
                >
                  Staff login
                </Link>
              </div>
            </nav>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="shrink-0">
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {panel}
    </div>
  );
}
