'use client';

import { getImageProps } from 'next/image';
import { useEffect } from 'react';

import type { CatalogCategory } from '@/features/laundry-price-list/types';
import { neighborRackIndexes } from '@/features/marketing/pricing/lib/neighbor-rack-indexes';
import {
  enqueuePricingPhotoPrefetch,
  pickPricingPhotoPrefetchCandidate,
  PRICING_CATEGORY_PHOTO_SIZES,
  PRICING_PHOTO_PREFETCH_HEIGHT,
  PRICING_PHOTO_PREFETCH_WIDTH,
} from '@/features/marketing/pricing/lib/prefetch-pricing-product-image';
import { resolvePricingProductImage } from '@/features/marketing/pricing/pricing-product-images';

type RackPhotoItem = {
  slug: string;
  name: string;
};

type UsePrefetchRackPhotosOptions = {
  items: readonly RackPhotoItem[];
  category: CatalogCategory;
  /** Live spotlight index — warm ±1 before the settled photo crossfade. */
  activeIndex: number;
  /**
   * When false, skip enqueue (prefers-reduced-motion or section off-screen).
   * Does not abort in-flight downloads already started by other racks.
   */
  enabled: boolean;
};

function optimizerUrlForProductSrc(src: string): string {
  const { props } = getImageProps({
    alt: '',
    src,
    width: PRICING_PHOTO_PREFETCH_WIDTH,
    height: PRICING_PHOTO_PREFETCH_HEIGHT,
    sizes: PRICING_CATEGORY_PHOTO_SIZES,
  });
  return pickPricingPhotoPrefetchCandidate(props.src, props.srcSet);
}

/**
 * Prefetch next/image URLs for activeIndex ± 1 so rack crossfades never flash
 * an empty muted frame. Concurrent loads are capped page-wide.
 */
export function usePrefetchRackPhotos({
  items,
  category,
  activeIndex,
  enabled,
}: UsePrefetchRackPhotosOptions): void {
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    for (const index of neighborRackIndexes(activeIndex, items.length)) {
      const item = items[index];
      if (!item) continue;
      const image = resolvePricingProductImage(item.slug, item.name, category);
      enqueuePricingPhotoPrefetch(optimizerUrlForProductSrc(image.src));
    }
  }, [activeIndex, category, enabled, items]);
}
