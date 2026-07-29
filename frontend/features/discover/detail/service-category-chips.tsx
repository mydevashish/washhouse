'use client';

import { cn } from '@/lib/utils';

export type CategoryChip = {
  id: string;
  label: string;
  count: number;
};

type ServiceCategoryChipsProps = {
  chips: CategoryChip[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

/** Sticky horizontal category chips for storefront catalogue scroll-spy. */
export function ServiceCategoryChips({
  chips,
  activeId,
  onSelect,
  className,
}: ServiceCategoryChipsProps) {
  if (chips.length <= 1) return null;

  return (
    <nav
      aria-label="Service categories"
      className={cn(
        'sticky top-14 z-20 -mx-1 border-b border-border/60 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className,
      )}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => {
          const active = activeId === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelect(chip.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {chip.label}
              <span className="ml-1.5 tabular-nums opacity-80">({chip.count})</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
