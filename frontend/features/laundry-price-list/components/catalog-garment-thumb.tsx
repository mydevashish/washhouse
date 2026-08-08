import Image from 'next/image';

import type { WashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { cn } from '@/lib/utils';

type CatalogGarmentThumbProps = {
  photo: WashhouseCatalogPhoto;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** First-row Cloth Wall tiles may set priority; others stay lazy. */
  priority?: boolean;
};

const SIZE_PX = { sm: 32, md: 40, lg: 56, xl: 96 } as const;

/** Compact catalog garment tile for price lists and compare hints.
 * Intentionally static — no hang sway (sway is for atelier product frames only). */
export function CatalogGarmentThumb({
  photo,
  size = 'sm',
  className,
  priority = false,
}: CatalogGarmentThumbProps) {
  const px = SIZE_PX[size];
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-14 w-14 rounded-2xl',
        size === 'xl' && 'h-24 w-24 rounded-2xl sm:h-28 sm:w-28',
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
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    </span>
  );
}
