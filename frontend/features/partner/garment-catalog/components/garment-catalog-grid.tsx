'use client';

import { GarmentCatalogCard } from '@/features/partner/garment-catalog/components/garment-catalog-card';
import type { GarmentCatalogItem } from '@/services/partner-garment-catalog';

export function GarmentCatalogGrid({
  items,
  togglingId,
  onEdit,
  onToggleVisibility,
}: {
  items: GarmentCatalogItem[];
  togglingId?: string | null;
  onEdit: (item: GarmentCatalogItem) => void;
  onToggleVisibility: (item: GarmentCatalogItem) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:hidden"
      data-testid="garment-catalog-grid"
    >
      {items.map((item) => (
        <GarmentCatalogCard
          key={item.id}
          item={item}
          togglingVisibility={togglingId === item.id}
          onEdit={() => onEdit(item)}
          onToggleVisibility={() => onToggleVisibility(item)}
        />
      ))}
    </div>
  );
}
