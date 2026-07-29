import Image from 'next/image';

import type { WashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { cn } from '@/lib/utils';

type CatalogGarmentThumbProps = {
  photo: WashhouseCatalogPhoto;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_PX = { sm: 32, md: 40, lg: 56 } as const;

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
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-14 w-14 rounded-2xl',
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
