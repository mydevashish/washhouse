'use client';

import { Minus } from 'lucide-react';

import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { ClothWallTile } from '@/features/partner-shop-floor/lib/cloth-wall-items';
import { unitPriceForTile } from '@/features/partner-shop-floor/lib/cloth-wall-items';
import type { ClothWallProcess } from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import { cn } from '@/lib/utils';

type ClothWallTileButtonProps = {
  tile: ClothWallTile;
  quantity: number;
  process: ClothWallProcess;
  onIncrement: () => void;
  onDecrement: () => void;
  onProcessChange?: (process: ClothWallProcess) => void;
  /** Eager-load first-row thumbs for Cloth Wall TTI. */
  imagePriority?: boolean;
};

export function ClothWallTileButton({
  tile,
  quantity,
  process,
  onIncrement,
  onDecrement,
  onProcessChange,
  imagePriority = false,
}: ClothWallTileButtonProps) {
  const price = unitPriceForTile(tile, process);
  const dual = tile.priceMode === 'dual';

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60',
        quantity > 0 && 'ring-2 ring-primary',
      )}
      data-testid={`cloth-wall-tile-${tile.id}`}
    >
      <button
        type="button"
        onClick={onIncrement}
        className={cn(
          'flex min-h-[9rem] flex-col items-center gap-2 p-3 text-center',
          'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          'motion-safe:active:scale-[0.98]',
        )}
        aria-label={`Add ${tile.hinglish}, ${formatInr(price)}`}
      >
        {quantity > 0 ? (
          <span
            className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground"
            aria-hidden
          >
            {quantity}
          </span>
        ) : null}
        <CatalogGarmentThumb
          photo={tile.photo}
          size="xl"
          className="mx-auto"
          priority={imagePriority}
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-semibold leading-tight text-foreground">
            {tile.hinglish}
          </span>
          <span className="text-xs text-muted-foreground">{tile.english}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatInr(price)}
          </span>
        </span>
      </button>

      {dual && onProcessChange ? (
        <div
          className="flex gap-1 border-t border-border/50 px-2 py-1.5"
          role="group"
          aria-label={`Process for ${tile.hinglish}`}
        >
          {(
            [
              { id: 'dry_clean' as const, label: 'Dry clean' },
              ...(tile.allowsPress && tile.pressInr != null
                ? [{ id: 'press' as const, label: 'Press' }]
                : []),
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onProcessChange(opt.id)}
              className={cn(
                'min-h-11 flex-1 rounded-lg px-1 text-xs font-medium',
                process === opt.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}

      {quantity > 0 ? (
        <div className="flex items-center justify-center border-t border-border/50 p-1.5">
          <button
            type="button"
            onClick={onDecrement}
            className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove one ${tile.hinglish}`}
            data-testid={`cloth-wall-dec-${tile.id}`}
          >
            <Minus className="h-6 w-6" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
