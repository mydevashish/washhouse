import Link from 'next/link';
import { MapPin } from 'lucide-react';

import type { LaundryListItem } from '@/services/laundries';
import { cn } from '@/lib/utils';

type StoresCardProps = {
  laundry: LaundryListItem;
  className?: string;
};

/** Slim marketing directory row — name + city only (no ratings/prices/compare). */
export function StoresCard({ laundry, className }: StoresCardProps) {
  return (
    <Link
      href={`/discover/${laundry.id}`}
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-border/80 bg-card px-4 py-4',
        'transition-colors hover:border-primary/40 hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`${laundry.name}, ${laundry.city}`}
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden
      >
        <MapPin className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground group-hover:text-primary">
          {laundry.name}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{laundry.city}</span>
      </span>
    </Link>
  );
}
