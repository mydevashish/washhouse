import Image from 'next/image';

import type { WashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { cn } from '@/lib/utils';

type CatalogGarmentThumbProps = {
  photo: WashhouseCatalogPhoto;
  size?: 'sm' | 'md';
  className?: string;
};

const SIZE_PX = { sm: 32, md: 40 } as const;

/** Compact catalog garment tile for price lists and compare hints.
 * Intentionally static — no hang sway (sway is for atelier product frames only). */
export function CatalogGarmentThumb({
  photo,
  size = 'sm',
  className,
}: CatalogGarmentThumbProps) {
  const px = SIZE_PX[size];
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={px}
        height={px}
        className="h-full w-full object-cover"
        sizes={`${px}px`}
      />
    </span>
  );
}
