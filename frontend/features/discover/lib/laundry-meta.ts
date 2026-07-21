import type { LaundryListItem } from '@/services/laundries';
import {
  getLaundryImage as getMarketplaceLaundryImage,
  LAUNDRY_IMAGES_BY_SLUG as MARKETPLACE_LAUNDRY_IMAGES_BY_SLUG,
} from '@/features/discover/marketplace/laundry-images';

/** @deprecated Prefer importing from `marketplace/laundry-images` — kept for existing callers. */
export const LAUNDRY_IMAGES_BY_SLUG = MARKETPLACE_LAUNDRY_IMAGES_BY_SLUG;

export type LaundryMeta = {
  distanceKm: number;
  deliveryHours: number;
  /** Real owner-set start price (INR), or null when no compare hints published */
  startPrice: number | null;
};

export type EnrichedLaundry = LaundryListItem & LaundryMeta & { image: string };

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % 997;
  return hash;
}

export function getLaundryImage(slug: string, index: number): string {
  return getMarketplaceLaundryImage(slug, index);
}

/** Pseudo distance/delivery until geo APIs ship — prices come from the API. */
export function getLaundryMeta(slug: string): Pick<LaundryMeta, 'distanceKm' | 'deliveryHours'> {
  const hash = hashSlug(slug);
  return {
    distanceKm: Number((1.2 + (hash % 28) / 10).toFixed(1)),
    deliveryHours: 24 + (hash % 3) * 12,
  };
}

/** Parse API compare start price for filter/sort; null when laundry has no hints. */
export function resolveStartPrice(laundry: LaundryListItem): number | null {
  if (laundry.start_price_inr != null && laundry.start_price_inr !== '') {
    const n = Number(laundry.start_price_inr);
    return Number.isFinite(n) ? n : null;
  }
  const candidates = [laundry.wash_fold_from_inr, laundry.shirt_dry_clean_from_inr]
    .map((v) => (v != null && v !== '' ? Number(v) : NaN))
    .filter((n) => Number.isFinite(n));
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

export function enrichLaundry(laundry: LaundryListItem, index: number): EnrichedLaundry {
  return {
    ...laundry,
    ...getLaundryMeta(laundry.slug),
    startPrice: resolveStartPrice(laundry),
    image: getLaundryImage(laundry.slug, index),
  };
}

export function minServicePrice(services: { price_inr: string; is_active: boolean }[]): number {
  const active = services.filter((s) => s.is_active);
  if (!active.length) return 99;
  return Math.min(...active.map((s) => Number(s.price_inr)));
}

export function deliveryLabel(hours: number): string {
  if (hours <= 24) return '24 hour delivery';
  if (hours <= 36) return '36 hour delivery';
  return '48 hour delivery';
}

export function serviceDeliveryHours(category: string): number {
  switch (category) {
    case 'wash':
      return 24;
    case 'dry_clean':
      return 48;
    case 'iron':
      return 24;
    case 'special':
      return 72;
    default:
      return 24;
  }
}
