/** Local laundry imagery for discover partners and heroes — no remote Unsplash. */

import { MARKETING_HERO_IMAGES } from '@/features/marketing/catalog/marketing-hero-images';

/** Discover listing / detail cover — folded laundry (matches marketing welcome). */
export const HERO_IMAGE = MARKETING_HERO_IMAGES.welcome.src;

/**
 * Verified local heroes for marketplace marketing slides.
 * Keys align with historical Unsplash slide roles (primary / compare / partner / doorstep).
 */
export const HERO_SLIDE_IMAGES = {
  /** Folded fresh laundry — welcome slide */
  primary: MARKETING_HERO_IMAGES.welcome.src,
  /** Professional laundry facility — services slide */
  compare: MARKETING_HERO_IMAGES.services.src,
  /** Partner laundromat interior — franchise slide */
  partner: MARKETING_HERO_IMAGES.franchise.src,
  /** Pickup / delivery laundry basket — delivery slide */
  doorstep: MARKETING_HERO_IMAGES.delivery.src,
} as const;

export const LAUNDRY_IMAGES_BY_SLUG: Record<string, string> = {
  'demo-quick-wash-koramangala': HERO_SLIDE_IMAGES.primary,
  'demo-sparkle-indiranagar': HERO_SLIDE_IMAGES.compare,
  'demo-freshfold-hsr': HERO_SLIDE_IMAGES.doorstep,
};

const FALLBACK_POOL = [
  HERO_SLIDE_IMAGES.primary,
  HERO_SLIDE_IMAGES.doorstep,
  HERO_SLIDE_IMAGES.compare,
  HERO_SLIDE_IMAGES.partner,
] as const;

export function getLaundryImage(slug: string, index: number): string {
  return LAUNDRY_IMAGES_BY_SLUG[slug] ?? FALLBACK_POOL[index % FALLBACK_POOL.length]!;
}

/** Stable pseudo-random meta from slug for demo UI (distance/delivery only). */
export function getPartnerMeta(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % 997;
  const distanceKm = (1.2 + (hash % 28) / 10).toFixed(1);
  const deliveryMin = 25 + (hash % 25);
  return { distanceKm, deliveryMin };
}
