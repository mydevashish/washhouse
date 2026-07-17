import type { CatalogCategory } from '@/features/laundry-price-list/types';

/**
 * One lightweight CSS/SVG loop per category — atmosphere on the photo plane only.
 * Tickets stay CSS 3D; no Lottie/video.
 */
export type PricingCategoryMoodVariant = 'steam' | 'fabric' | 'hang';

export const PRICING_CATEGORY_MOOD: Record<CatalogCategory, PricingCategoryMoodVariant> = {
  laundry_by_kg: 'steam',
  men: 'hang',
  women: 'fabric',
  kids: 'fabric',
  winter: 'hang',
  household: 'fabric',
};

export function getPricingCategoryMood(category: CatalogCategory): PricingCategoryMoodVariant {
  return PRICING_CATEGORY_MOOD[category];
}
