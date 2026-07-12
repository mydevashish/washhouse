'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { buildBreadcrumbs } from '@/lib/navigation/breadcrumbs';
import type { AppContext } from '@/lib/navigation/types';
import { cn } from '@/lib/utils';

export function NavbarBreadcrumbs({
  app,
  className,
}: {
  app: AppContext;
  className?: string;
}) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname, app);
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('hidden min-w-0 md:block', className)}>
      <ol className="flex min-w-0 items-center gap-0.5 text-[11px] leading-none text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-0.5">
              {i > 0 && <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-40" aria-hidden />}
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="truncate hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn('truncate', isLast && 'text-foreground/80')}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
