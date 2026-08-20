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
  // onProcessChange?: (process: ClothWallProcess) => void;
  /** Eager-load first-row thumbs for Cloth Wall TTI. */
  imagePriority?: boolean;
  /** Hide the price display (UI-only) */
  hidePrice?: boolean;
  /** Compact (smaller) layout for thumbnail-only dialogs */
  compact?: boolean;
};

export function ClothWallTileButton({
  tile,
  quantity,
  process,
  onIncrement,
  onDecrement,
  imagePriority = false,
  hidePrice = false,
  compact = false,
}: ClothWallTileButtonProps) {
  const price = unitPriceForTile(tile, process);

  return (
    <div
      className={cn(
        'relative box-border flex h-[266px] w-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-border/60',
        quantity > 0 && 'ring-2 ring-inset ring-primary',
        compact && 'h-[190px]',
      )}
      data-testid={`cloth-wall-tile-${tile.id}`}
    >
        <button
          type="button"
          onClick={() => onIncrement()}
          className={cn(
            'relative flex min-h-0 flex-1 w-full flex-col items-center text-center',
            compact ? 'gap-1.5 p-2' : 'gap-2 p-3',
            'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            'motion-safe:active:scale-[0.98]',
          )}
          aria-label={
            hidePrice
              ? `Add ${tile.hinglish}`
              : `Add ${tile.hinglish}, ${formatInr(price)}`
          }
        >
        {quantity > 0 ? (
          <span
            className="absolute right-2 top-2 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground"
            aria-hidden
          >
            {quantity}
          </span>
        ) : null}

        {/* Smaller fixed image area */}
        <div
          className={cn(
            'flex w-full shrink-0 items-center justify-center',
            compact ? 'h-10' : 'h-14',
          )}
        >
          {tile.photo ? (
            <CatalogGarmentThumb
              photo={tile.photo}
              size={compact ? 'md' : 'xl'}
              className={cn(
                'mx-auto',
                compact ? 'h-10 w-10' : 'h-12 w-12',
              )}
              priority={imagePriority}
            />
          ) : null}
        </div>

        {/* Fixed text area */}
        <span
          className={cn(
            'flex w-full flex-col items-center',
            compact ? 'gap-0' : 'gap-0',
          )}
        >
          <span
            className={cn(
              'flex h-[42px] items-start justify-center overflow-hidden text-center font-semibold leading-tight text-foreground',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {tile.hinglish}
          </span>

          <span className="h-5 overflow-hidden text-xs leading-5 text-muted-foreground">
            {tile.english}
          </span>

          {!hidePrice ? (
            <span className="h-5 text-sm font-semibold tabular-nums text-foreground">
              {formatInr(price)}
            </span>
          ) : null}
        </span>
      </button>

      {/* Always same bottom area when selected */}
      {quantity > 0 ? (
        <div className="flex h-[62px] shrink-0 items-center justify-center border-t border-border/50 p-1.5">
          <button
            type="button"
            onClick={() => {
              onDecrement();
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove one ${tile.hinglish}`}
            data-testid={`cloth-wall-dec-${tile.id}`}
          >
            <Minus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
