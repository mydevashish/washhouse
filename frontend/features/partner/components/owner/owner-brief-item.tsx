import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export function OwnerBriefItem({
  title,
  reason,
  href,
  count,
  icon: Icon,
  imageSrc,
  imageAlt,
  className,
}: {
  title: string;
  /** Why it matters — one short line. */
  reason: string;
  href: string;
  count?: number;
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2.5 py-2 ring-1 ring-transparent transition-colors',
        'hover:bg-muted/50 hover:ring-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-50">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? ''}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : Icon ? (
          <Icon className="h-4 w-4" aria-hidden />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          {typeof count === 'number' && count > 0 ? (
            <span className="rounded-md bg-warning-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-warning">
              {count}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{reason}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** Compact chip variant of a brief action (same destination pattern). */
export function OwnerActionChip({
  label,
  href,
  count,
  className,
}: {
  label: string;
  href: string;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 text-xs font-medium text-foreground',
        'ring-1 ring-border/50 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span>{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="tabular-nums text-warning">{count}</span>
      ) : null}
    </Link>
  );
}
