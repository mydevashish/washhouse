'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { LaundryFilters, SortOption } from '@/features/discover/listing/filter-laundries';

type LaundryFiltersBarProps = {
  filters: LaundryFilters;
  onChange: (next: LaundryFilters) => void;
  resultCount: number;
  /** Server total when search is active */
  totalCount?: number;
  /** Hide "0 nearby" while the first fetch is in flight */
  isLoading?: boolean;
  /** Show a soft refresh hint when refetching with no rows yet */
  isFetching?: boolean;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'top_rated', label: 'Top rated' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'lowest_price', label: 'Lowest price' },
  { value: 'fastest', label: 'Fastest delivery' },
];

export function LaundryFiltersBar({
  filters,
  onChange,
  resultCount,
  totalCount,
  isLoading = false,
  isFetching = false,
}: LaundryFiltersBarProps) {
  return (
    <Card className="shadow-soft" role="search" aria-label="Filter laundries">
      <CardContent className="p-4 sm:p-5">
        <p className="text-base font-semibold text-foreground">Filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Narrow results by rating, distance, delivery time, and price
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="filter-rating">Rating</Label>
            <Select
              id="filter-rating"
              value={String(filters.minRating)}
              onChange={(e) => onChange({ ...filters, minRating: Number(e.target.value) })}
              aria-label="Minimum rating"
            >
              <option value={0}>Any rating</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filter-distance">Distance</Label>
            <Select
              id="filter-distance"
              value={String(filters.maxDistance)}
              onChange={(e) => onChange({ ...filters, maxDistance: Number(e.target.value) })}
              aria-label="Maximum distance"
            >
              <option value={3}>Within 3 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filter-delivery">Delivery time</Label>
            <Select
              id="filter-delivery"
              value={String(filters.maxDeliveryHours)}
              onChange={(e) =>
                onChange({ ...filters, maxDeliveryHours: Number(e.target.value) })
              }
              aria-label="Maximum delivery time"
            >
              <option value={999}>Any delivery time</option>
              <option value={24}>Within 24 hours</option>
              <option value={36}>Within 36 hours</option>
              <option value={48}>Within 48 hours</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filter-price">Starting price</Label>
            <Select
              id="filter-price"
              value={String(filters.maxPrice)}
              onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              aria-label="Maximum starting price"
            >
              <option value={100}>Under ₹100/kg</option>
              <option value={150}>Under ₹150/kg</option>
              <option value={250}>Under ₹250/kg</option>
              <option value={500}>Any price</option>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="filter-sort">Sort by</Label>
            <Select
              id="filter-sort"
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
              aria-label="Sort laundries"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
            {isLoading ? (
              <span className="text-muted-foreground">Loading laundries…</span>
            ) : isFetching && resultCount === 0 ? (
              <span className="text-muted-foreground">Connecting to laundries…</span>
            ) : (
              <>
                <span className="text-foreground">{resultCount}</span>{' '}
                {resultCount === 1 ? 'laundry' : 'laundries'}
                {totalCount !== undefined && totalCount !== resultCount
                  ? ` (of ${totalCount} matches)`
                  : ' nearby'}
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
