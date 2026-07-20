import type { CatalogCategory } from '@/features/laundry-price-list/types';
import { resolveCatalogPhotoKey } from '@/features/marketing/catalog/resolve-catalog-photo-key';
import { WASHHOUSE_CATALOG_PHOTOS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import {
  getPricingCategoryImage,
  type PricingCategoryImage,
} from '@/features/marketing/pricing/pricing-category-images';

/**
 * Garment-family catalog tiles for scroll-synced rack photos.
 * Matched by catalog slug / name — falls back to category hero when unknown.
 */
export const PRICING_PRODUCT_PHOTOS = WASHHOUSE_CATALOG_PHOTOS satisfies Record<
  string,
  PricingCategoryImage
>;

export type PricingProductPhotoKey = keyof typeof PRICING_PRODUCT_PHOTOS;

export function resolveProductPhotoKey(
  slug: string,
  name: string,
): PricingProductPhotoKey | null {
  return resolveCatalogPhotoKey(slug, name);
}

/**
 * Resolve the editorial frame for a price-tag product.
 * Unknown garments keep the category hero so the rack never blanks.
 */
export function resolvePricingProductImage(
  slug: string,
  name: string,
  category: CatalogCategory,
): PricingCategoryImage {
  const key = resolveProductPhotoKey(slug, name);
  if (key) return PRICING_PRODUCT_PHOTOS[key];
  return getPricingCategoryImage(category);
}
