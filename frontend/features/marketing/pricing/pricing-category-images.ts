import type { CatalogCategory } from '@/features/laundry-price-list/types';
import { WASHHOUSE_CATALOG_CATEGORY_HEROES } from '@/features/marketing/catalog/washhouse-catalog-photos';

export type PricingCategoryImage = {
  src: string;
  alt: string;
};

/**
 * Soft strength = whisper depth behind every rack.
 * Rich = women / kids — stronger fabric vibe + category tint wash (still misted, never a second hero).
 */
export type PricingAmbientStrength = 'soft' | 'rich';

export type PricingCategoryAmbient = {
  src: string;
  strength: PricingAmbientStrength;
};

/** Catalog category heroes for each price-guide section. */
export const PRICING_CATEGORY_IMAGES: Record<CatalogCategory, PricingCategoryImage> = {
  laundry_by_kg: WASHHOUSE_CATALOG_CATEGORY_HEROES.laundry_by_kg,
  men: WASHHOUSE_CATALOG_CATEGORY_HEROES.men,
  women: WASHHOUSE_CATALOG_CATEGORY_HEROES.women,
  kids: WASHHOUSE_CATALOG_CATEGORY_HEROES.kids,
  winter: WASHHOUSE_CATALOG_CATEGORY_HEROES.winter,
  household: WASHHOUSE_CATALOG_CATEGORY_HEROES.household,
};

/**
 * Ambient depth behind each photo+rates unit (decorative, aria-hidden).
 * Reuses category heroes — blur + tint handle softness; women / kids stay richer.
 */
export const PRICING_CATEGORY_AMBIENT: Record<CatalogCategory, PricingCategoryAmbient> = {
  laundry_by_kg: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.laundry_by_kg.src,
    strength: 'soft',
  },
  men: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.men.src,
    strength: 'soft',
  },
  women: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.women.src,
    strength: 'rich',
  },
  kids: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.kids.src,
    strength: 'rich',
  },
  winter: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.winter.src,
    strength: 'soft',
  },
  household: {
    src: WASHHOUSE_CATALOG_CATEGORY_HEROES.household.src,
    strength: 'soft',
  },
};

export function getPricingCategoryImage(category: CatalogCategory): PricingCategoryImage {
  return PRICING_CATEGORY_IMAGES[category];
}

export function getPricingCategoryAmbient(category: CatalogCategory): PricingCategoryAmbient {
  return PRICING_CATEGORY_AMBIENT[category];
}
