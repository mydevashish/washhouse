import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

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
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-h-[7.5rem] flex-col justify-end overflow-hidden rounded-xl ring-1 ring-border/60',
        'bg-card shadow-soft transition-[transform,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'active:scale-[0.99]',
        className,
      )}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        priority={priority}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent dark:from-black/80 dark:via-black/40"
        aria-hidden
      />
      <div className="relative z-10 flex items-end justify-between gap-2 p-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-white/80">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {typeof badgeCount === 'number' && badgeCount > 0 ? (
            <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          ) : null}
          <ArrowUpRight
            className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
