'use client';

import Image from 'next/image';
import { Eye, EyeOff, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  garmentPriceChips,
  resolveGarmentCatalogPhoto,
} from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import { LazyMount } from '@/features/partner-shop-floor/components/lazy-mount';
import type { GarmentCatalogItem } from '@/services/partner-garment-catalog';
import { cn } from '@/lib/utils';

export function GarmentCatalogCard({
  item,
  togglingVisibility,
  onEdit,
  onToggleVisibility,
}: {
  item: GarmentCatalogItem;
  togglingVisibility?: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
}) {
  const photo = resolveGarmentCatalogPhoto(item);
  const chips = garmentPriceChips(item);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm"
      data-testid={`garment-catalog-card-${item.garment_code}`}
    >
      <LazyMount
        className="relative aspect-[4/3] w-full bg-muted/30"
        minHeightClassName="aspect-[4/3] w-full min-h-0"
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          loading="lazy"
          className="object-cover"
          sizes="50vw"
        />
        <span className="absolute left-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 font-mono text-[10px] font-medium backdrop-blur-sm dark:bg-card/90">
          {item.garment_code}
        </span>
      </LazyMount>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{item.category}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {chips.length === 0 ? (
            <span className="text-xs text-muted-foreground">No prices set</span>
          ) : (
            chips.map((chip) => (
              <span
                key={chip.type}
                className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums sm:text-xs"
              >
                {chip.label} ₹{chip.inr}
              </span>
            ))
          )}
        </div>
        <div className="mt-auto flex items-center gap-1 pt-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 flex-1 gap-1"
            data-testid={`garment-visibility-toggle-${item.garment_code}`}
            disabled={togglingVisibility}
            aria-pressed={item.is_visible}
            aria-label={item.is_visible ? 'Hide at counter' : 'Show at counter'}
            onClick={onToggleVisibility}
          >
            {item.is_visible ? (
              <Eye className={cn('h-3.5 w-3.5', togglingVisibility && 'opacity-50')} aria-hidden />
            ) : (
              <EyeOff className={cn('h-3.5 w-3.5', togglingVisibility && 'opacity-50')} aria-hidden />
            )}
            {item.is_visible ? 'Visible' : 'Hidden'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 flex-1 gap-1"
            data-testid={`garment-edit-btn-${item.garment_code}`}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        </div>
      </div>
    </article>
  );
}
