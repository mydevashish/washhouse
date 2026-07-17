'use client';

import { cn } from '@/lib/utils';
import {
  PRICE_LIST_CATEGORY_TABS,
  type CatalogCategory,
} from '@/features/partner-price-list/types';

type PriceListCategoryTabsProps = {
  active: CatalogCategory;
  onChange: (category: CatalogCategory) => void;
  counts?: Partial<Record<CatalogCategory, number>>;
};

export function PriceListCategoryTabs({ active, onChange, counts }: PriceListCategoryTabsProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Price list categories">
      <div className="flex min-w-max gap-2">
        {PRICE_LIST_CATEGORY_TABS.map(({ id, label }) => {
          const selected = active === id;
          const count = counts?.[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(id)}
              className={cn(
                'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                  : 'border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
              {count != null && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs tabular-nums',
                    selected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
