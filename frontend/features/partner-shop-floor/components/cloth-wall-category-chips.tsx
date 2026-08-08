'use client';

import {
  CLOTH_WALL_CATEGORY_CHIPS,
  type ClothWallCategoryChip,
} from '@/features/partner-shop-floor/lib/cloth-wall-items';
import { cn } from '@/lib/utils';

type ClothWallCategoryChipsProps = {
  value: ClothWallCategoryChip | 'all';
  onChange: (value: ClothWallCategoryChip | 'all') => void;
};

export function ClothWallCategoryChips({ value, onChange }: ClothWallCategoryChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Garment category"
      data-testid="cloth-wall-categories"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'all'}
        onClick={() => onChange('all')}
        className={cn(
          'min-h-14 shrink-0 rounded-2xl px-5 text-base font-semibold',
          value === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        All
      </button>
      {CLOTH_WALL_CATEGORY_CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          role="tab"
          aria-selected={value === chip.id}
          onClick={() => onChange(chip.id)}
          className={cn(
            'min-h-14 shrink-0 rounded-2xl px-5 text-base font-semibold',
            value === chip.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
