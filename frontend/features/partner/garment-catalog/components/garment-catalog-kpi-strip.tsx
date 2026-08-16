'use client';

import { cn } from '@/lib/utils';

export function GarmentCatalogKpiStrip({
  total,
  visible,
  categories,
  loading,
}: {
  total: number;
  visible: number;
  categories: number;
  loading?: boolean;
}) {
  const chips = [
    { label: 'Total garments', value: total },
    { label: 'Visible at counter', value: visible },
    { label: 'Categories', value: categories },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:gap-3"
      data-testid="garment-catalog-kpi-strip"
      aria-busy={loading}
    >
      {chips.map((chip) => (
        <div
          key={chip.label}
          className={cn(
            'rounded-2xl border border-border bg-muted/20 px-3 py-2.5 text-center sm:px-4 sm:py-3',
            loading && 'animate-pulse',
          )}
        >
          <p className="text-lg font-semibold tabular-nums sm:text-xl">
            {loading ? '—' : chip.value}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-xs">{chip.label}</p>
        </div>
      ))}
    </div>
  );
}
