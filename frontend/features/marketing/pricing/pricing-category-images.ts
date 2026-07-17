import type { CatalogCategory } from '@/features/laundry-price-list/types';

/** Request wide enough for 5/12 of 1440 @2x (~1160px) without soft upscales. */
const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Softer / smaller source for blurred section ambient (not the editorial photo). */
const A = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

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

/** Editorial garment photos for each price-guide category (Unsplash). */
export const PRICING_CATEGORY_IMAGES: Record<CatalogCategory, PricingCategoryImage> = {
  laundry_by_kg: {
    src: U('photo-1558618666-fcd25c85cd64'),
    alt: 'Neatly folded laundry stacks ready after wash and fold',
  },
  men: {
    src: U('photo-1489987707025-afc232f7ea96'),
    alt: 'Pressed dress shirts hanging on a clean laundry rail',
  },
  women: {
    src: U('photo-1610030469983-98e550d6193c'),
    alt: 'Bright saree fabric draped with soft studio light',
  },
  kids: {
    src: U('photo-1519238263530-99bdd11df2ea'),
    alt: 'Colourful kids clothes folded and ready to wear',
  },
  winter: {
    src: U('photo-1544923246-77307dd654cb'),
    alt: 'Winter coats and outerwear hung after professional care',
  },
  household: {
    src: U('photo-1631049307264-da0ec9d70304'),
    alt: 'Fresh bed linen stacked neatly after laundry service',
  },
};

/**
 * Ambient depth behind each photo+rates unit (decorative, aria-hidden).
 * Women / kids use distinct fabric lifestyle frames; others reuse category mood at soft strength.
 */
export const PRICING_CATEGORY_AMBIENT: Record<CatalogCategory, PricingCategoryAmbient> = {
  laundry_by_kg: {
    src: A('photo-1558618666-fcd25c85cd64'),
    strength: 'soft',
  },
  men: {
    src: A('photo-1489987707025-afc232f7ea96'),
    strength: 'soft',
  },
  women: {
    /* Draped silk / saree fabric — atelier depth, not a second editorial hero */
    src: A('photo-1617627143750-d86bc21e42bb'),
    strength: 'rich',
  },
  kids: {
    /* Soft colourful kids garments — tasteful folded stack, not cartoonish */
    src: A('photo-1519238263530-99bdd11df2ea'),
    strength: 'rich',
  },
  winter: {
    src: A('photo-1544923246-77307dd654cb'),
    strength: 'soft',
  },
  household: {
    src: A('photo-1631049307264-da0ec9d70304'),
    strength: 'soft',
  },
};

export function getPricingCategoryImage(category: CatalogCategory): PricingCategoryImage {
  return PRICING_CATEGORY_IMAGES[category];
}

export function getPricingCategoryAmbient(category: CatalogCategory): PricingCategoryAmbient {
  return PRICING_CATEGORY_AMBIENT[category];
}
