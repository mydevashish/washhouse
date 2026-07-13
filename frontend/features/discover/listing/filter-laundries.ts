import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';

export type SortOption = 'top_rated' | 'nearest' | 'lowest_price' | 'fastest';

export type LaundryFilters = {
  search: string;
  minRating: number;
  maxDistance: number;
  maxDeliveryHours: number;
  maxPrice: number;
  sort: SortOption;
};

/** Sentinel values matching LaundryFiltersBar "any" options. */
export const ANY_DELIVERY_HOURS = 999;
export const ANY_PRICE_INR = 500;

export const DEFAULT_FILTERS: LaundryFilters = {
  search: '',
  minRating: 0,
  maxDistance: 10,
  maxDeliveryHours: ANY_DELIVERY_HOURS,
  maxPrice: ANY_PRICE_INR,
  sort: 'top_rated',
};

export type ApiSearchSort = 'relevance' | 'rating' | 'name';

function toFiniteNumber(value: unknown, fallback: number): number {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveCap(value: unknown, fallback: number): number {
  const parsed = toFiniteNumber(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

/** Coerce filter caps so invalid/zero values cannot exclude every laundry. */
export function normalizeLaundryFilters(filters: LaundryFilters): LaundryFilters {
  return {
    search: filters.search ?? '',
    minRating: Math.max(0, toFiniteNumber(filters.minRating, DEFAULT_FILTERS.minRating)),
    maxDistance: Math.max(1, toPositiveCap(filters.maxDistance, DEFAULT_FILTERS.maxDistance)),
    maxDeliveryHours: toPositiveCap(filters.maxDeliveryHours, DEFAULT_FILTERS.maxDeliveryHours),
    maxPrice: toPositiveCap(filters.maxPrice, DEFAULT_FILTERS.maxPrice),
    sort: filters.sort ?? DEFAULT_FILTERS.sort,
  };
}

/** Maps UI sort to server search sort (text relevance handled server-side). */
export function mapSortToApi(sort: SortOption): ApiSearchSort {
  if (sort === 'top_rated') return 'rating';
  return 'relevance';
}

/** Client-side filters for pseudo-fields (distance, price, delivery) and local sort. */
export function applyClientFilters(
  items: EnrichedLaundry[],
  filters: LaundryFilters,
): EnrichedLaundry[] {
  const f = normalizeLaundryFilters(filters);

  let result = items.filter((l) => {
    const rating = Number(l.avg_rating);
    if (Number.isFinite(rating) && rating < f.minRating) return false;

    const distance = Number(l.distanceKm);
    if (Number.isFinite(distance) && distance > f.maxDistance) return false;

    const delivery = Number(l.deliveryHours);
    if (
      Number.isFinite(delivery) &&
      f.maxDeliveryHours < ANY_DELIVERY_HOURS &&
      delivery > f.maxDeliveryHours
    ) {
      return false;
    }

    const price = Number(l.startPrice);
    if (Number.isFinite(price) && f.maxPrice < ANY_PRICE_INR && price > f.maxPrice) {
      return false;
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    switch (f.sort) {
      case 'nearest':
        return Number(a.distanceKm) - Number(b.distanceKm);
      case 'lowest_price':
        return Number(a.startPrice) - Number(b.startPrice);
      case 'fastest':
        return Number(a.deliveryHours) - Number(b.deliveryHours);
      case 'top_rated':
        return Number(b.avg_rating) - Number(a.avg_rating);
      default:
        return Number(b.avg_rating) - Number(a.avg_rating);
    }
  });

  return result;
}
