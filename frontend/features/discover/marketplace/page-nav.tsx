'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const SECTIONS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#services', label: 'Services' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#partners', label: 'Partners' },
] as const;

export function MarketplacePageNav() {
  const pathname = usePathname();
  if (pathname !== '/discover') return null;

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
          {SECTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-fg-1 transition-colors',
                'hover:bg-bg-1 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
