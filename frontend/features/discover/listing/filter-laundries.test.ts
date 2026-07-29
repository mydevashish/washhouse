import {
  enrichLaundry,
  pickNearestOrFeatured,
  resolveStartPrice,
} from '@/features/discover/lib/laundry-meta';
import type { LaundryListItem } from '@/services/laundries';

import {
  ANY_DELIVERY_HOURS,
  ANY_PRICE_INR,
  applyClientFilters,
  DEFAULT_FILTERS,
  normalizeLaundryFilters,
} from './filter-laundries';

const DEMO_LAUNDRIES: LaundryListItem[] = [
  {
    id: 'a',
    name: 'Quick Wash Koramangala',
    slug: 'demo-quick-wash-koramangala',
    city: 'Bengaluru',
    avg_rating: '4.60',
    review_count: 128,
    is_verified: true,
    latitude: 12.9352,
    longitude: 77.6245,
    wash_fold_from_inr: '89.00',
    shirt_dry_clean_from_inr: '69.00',
    start_price_inr: '69.00',
  },
  {
    id: 'b',
    name: 'Sparkle Clean Indiranagar',
    slug: 'demo-sparkle-indiranagar',
    city: 'Bengaluru',
    avg_rating: '4.80',
    review_count: 256,
    is_verified: true,
    latitude: 12.9784,
    longitude: 77.6408,
    wash_fold_from_inr: '79.00',
    start_price_inr: '79.00',
  },
  {
    id: 'c',
    name: 'FreshFold HSR Layout',
    slug: 'demo-freshfold-hsr',
    city: 'Bengaluru',
    avg_rating: '4.40',
    review_count: 89,
    is_verified: true,
    // no owner compare prices yet
  },
];

function demoEnriched(userLocation?: { latitude: number; longitude: number } | null) {
  return DEMO_LAUNDRIES.map((laundry, index) => enrichLaundry(laundry, index, userLocation));
}

describe('resolveStartPrice', () => {
  it('uses API start_price_inr when present', () => {
    expect(resolveStartPrice(DEMO_LAUNDRIES[0]!)).toBe(69);
  });

  it('returns null when laundry has no compare hints', () => {
    expect(resolveStartPrice(DEMO_LAUNDRIES[2]!)).toBeNull();
  });
});

describe('enrichLaundry with user location', () => {
  it('uses haversine when coords and GPS are present', () => {
    const near = { latitude: 12.9352, longitude: 77.6245 };
    const enriched = enrichLaundry(DEMO_LAUNDRIES[0]!, 0, near);
    expect(enriched.distanceIsApproximate).toBe(false);
    expect(enriched.distanceKm).toBe(0);
  });

  it('falls back to approximate distance without store coords', () => {
    const near = { latitude: 12.9352, longitude: 77.6245 };
    const enriched = enrichLaundry(DEMO_LAUNDRIES[2]!, 0, near);
    expect(enriched.distanceIsApproximate).toBe(true);
  });
});

describe('pickNearestOrFeatured', () => {
  it('returns nearest by GPS when available', () => {
    const near = { latitude: 12.9352, longitude: 77.6245 };
    expect(pickNearestOrFeatured(DEMO_LAUNDRIES, near, 2).map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('falls back to top rated without GPS', () => {
    expect(pickNearestOrFeatured(DEMO_LAUNDRIES, null, 2).map((l) => l.id)).toEqual(['b', 'a']);
  });
});

describe('applyClientFilters', () => {
  it('keeps all demo laundries with default filters', () => {
    expect(applyClientFilters(demoEnriched(), DEFAULT_FILTERS)).toHaveLength(3);
  });

  it('does not drop all items when filter caps are corrupted to zero', () => {
    const corrupted = {
      ...DEFAULT_FILTERS,
      maxDistance: 0,
      maxDeliveryHours: 0,
      maxPrice: 0,
    };

    expect(applyClientFilters(demoEnriched(), corrupted)).toHaveLength(3);
  });

  it('coerces string filter values from form state', () => {
    const stringFilters = {
      ...DEFAULT_FILTERS,
      maxDistance: '10' as unknown as number,
      maxDeliveryHours: '999' as unknown as number,
      maxPrice: '500' as unknown as number,
      minRating: '0' as unknown as number,
    };

    expect(applyClientFilters(demoEnriched(), stringFilters)).toHaveLength(3);
  });

  it('respects strict distance cap when set intentionally', () => {
    const strict = { ...DEFAULT_FILTERS, maxDistance: 3 };
    const result = applyClientFilters(demoEnriched(), strict);

    expect(result).toHaveLength(2);
  });

  it('skips delivery and price caps for sentinel "any" values', () => {
    const filters = normalizeLaundryFilters({
      ...DEFAULT_FILTERS,
      maxDeliveryHours: ANY_DELIVERY_HOURS,
      maxPrice: ANY_PRICE_INR,
    });

    expect(filters.maxDeliveryHours).toBe(ANY_DELIVERY_HOURS);
    expect(filters.maxPrice).toBe(ANY_PRICE_INR);
    expect(applyClientFilters(demoEnriched(), filters)).toHaveLength(3);
  });

  it('filters by real owner start prices', () => {
    const result = applyClientFilters(demoEnriched(), {
      ...DEFAULT_FILTERS,
      maxPrice: 70,
    });
    // a starts at 69; b at 79 filtered out; c has no price (kept)
    expect(result.map((l) => l.id).sort()).toEqual(['a', 'c']);
  });

  it('sorts by lowest real price and puts unpriced last', () => {
    const result = applyClientFilters(demoEnriched(), {
      ...DEFAULT_FILTERS,
      sort: 'lowest_price',
    });
    expect(result.map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts nearest with real GPS distances ahead of approximate', () => {
    const enriched = demoEnriched();
    enriched[0]!.distanceKm = 8;
    enriched[0]!.distanceIsApproximate = true;
    enriched[1]!.distanceKm = 3;
    enriched[1]!.distanceIsApproximate = false;
    enriched[2]!.distanceKm = 1;
    enriched[2]!.distanceIsApproximate = false;

    const result = applyClientFilters(enriched, {
      ...DEFAULT_FILTERS,
      maxDistance: 50,
      sort: 'nearest',
    });

    expect(result.map((l) => l.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('normalizeLaundryFilters', () => {
  it('restores sensible defaults for invalid numeric caps', () => {
    const normalized = normalizeLaundryFilters({
      ...DEFAULT_FILTERS,
      maxDistance: Number.NaN,
      maxDeliveryHours: Number(''),
      maxPrice: undefined as unknown as number,
    });

    expect(normalized.maxDistance).toBe(DEFAULT_FILTERS.maxDistance);
    expect(normalized.maxDeliveryHours).toBe(DEFAULT_FILTERS.maxDeliveryHours);
    expect(normalized.maxPrice).toBe(DEFAULT_FILTERS.maxPrice);
  });
});
