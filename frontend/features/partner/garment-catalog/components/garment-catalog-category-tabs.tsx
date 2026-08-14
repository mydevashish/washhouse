'use client';

import { cn } from '@/lib/utils';
import { GARMENT_CATEGORIES, type GarmentCategory } from '@/services/partner-garment-catalog';

import type { GarmentCatalogCategoryFilter } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-list';

const TABS: { id: GarmentCatalogCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...GARMENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
];

export function GarmentCatalogCategoryTabs({
  value,
  onChange,
}: {
  value: GarmentCatalogCategoryFilter;
  onChange: (value: GarmentCatalogCategoryFilter) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="garment-catalog-category-tabs"
      role="tablist"
      aria-label="Garment categories"
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`garment-catalog-tab-${tab.id}`}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type { GarmentCategory };
