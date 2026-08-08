'use client';

import Image from 'next/image';

import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { resolveOrderLinePhoto } from '@/features/partner-shop-floor/lib/order-line-photo';
import { pieceCount } from '@/features/partner-shop-floor/lib/floor-status';
import { cn } from '@/lib/utils';

type Line = { service_name: string; quantity: number };

type FloorPhotoStackProps = {
  items: Line[];
  className?: string;
  maxThumbs?: number;
};

/** Overlapping garment thumbs + piece count for floor cards. */
export function FloorPhotoStack({ items, className, maxThumbs = 3 }: FloorPhotoStackProps) {
  const total = pieceCount(items);
  const visible = items.slice(0, maxThumbs);
  const overflow = Math.max(0, items.length - visible.length);

  if (items.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex h-10 items-center rounded-lg bg-muted px-2 text-xs text-muted-foreground',
          className,
        )}
        data-testid="floor-photo-stack"
      >
        0 pcs
      </span>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="floor-photo-stack"
    >
      <div className="flex items-center pl-1">
        {visible.map((item, index) => {
          const photo = resolveOrderLinePhoto(item.service_name);
          return (
            <span
              key={`${item.service_name}-${index}`}
              className={cn('relative -ml-2 first:ml-0', index > 0 && 'ring-2 ring-card rounded-lg')}
              style={{ zIndex: visible.length - index }}
            >
              <CatalogGarmentThumb photo={photo} size="md" />
            </span>
          );
        })}
        {overflow > 0 ? (
          <span className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-semibold ring-2 ring-card">
            +{overflow}
          </span>
        ) : null}
      </div>
      <span className="text-sm font-semibold tabular-nums text-muted-foreground">
        {total} pcs
      </span>
    </div>
  );
}

type FloorEmptyPictureProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Picture for empty boards (catalog hero — no new assets). */
export function FloorEmptyPicture({ src, alt, className }: FloorEmptyPictureProps) {
  return (
    <span
      className={cn(
        'relative mx-auto block h-28 w-28 overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 sm:h-32 sm:w-32',
        className,
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="128px" />
    </span>
  );
}
