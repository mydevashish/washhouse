import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Split card (image top / solid text panel bottom) — guaranteed title/subtitle contrast.
 * Visual polish Pattern C — docs/features/partner-customers-orders-hub-ui-polish.md
 */
export function OwnerPillarCard({
  title,
  subtitle,
  href,
  imageSrc,
  imageAlt,
  badgeCount,
  className,
  priority,
}: {
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  badgeCount?: number;
  className?: string;
  /** Eager load when above the fold on Advanced home. */
  priority?: boolean;
}) {
  const badgeLabel =
    typeof badgeCount === 'number' && badgeCount > 0
      ? `, ${badgeCount > 99 ? '99+' : badgeCount} waiting`
      : '';

  return (
    <Link
      href={href}
      aria-label={`${title}${badgeLabel}`}
      className={cn(
        'group relative flex min-h-[8.5rem] flex-col overflow-hidden rounded-xl ring-1 ring-border/60',
        'bg-card shadow-soft transition-[box-shadow] hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-safe:active:scale-[0.99]',
        className,
      )}
    >
      <div className="relative min-h-[4.75rem] flex-[1.15] overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
          priority={priority}
        />
        {typeof badgeCount === 'number' && badgeCount > 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </div>
      <div className="relative z-10 flex items-end justify-between gap-2 border-t border-border/50 bg-card px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <ArrowUpRight
          className="mb-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
