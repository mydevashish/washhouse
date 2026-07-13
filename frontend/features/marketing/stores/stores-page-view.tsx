'use client';

import { useState } from 'react';
import { MapPin, Search, Store } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';
import { HomeSearchBar } from '@/features/discover/homepage/home-search-bar';
import {
  DEFAULT_FILTERS,
  type LaundryFilters,
} from '@/features/discover/listing/filter-laundries';
import { LaundryCard } from '@/features/discover/listing/laundry-card';
import { LaundryCardSkeleton } from '@/features/discover/listing/laundry-card-skeleton';
import { LaundryFiltersBar } from '@/features/discover/listing/laundry-filters';
import { StoresCta } from '@/features/marketing/stores/stores-cta';
import { StoresHero } from '@/features/marketing/stores/stores-hero';

export function StoresPageView() {
  const [filters, setFilters] = useState<LaundryFilters>(DEFAULT_FILTERS);

  const {
    filtered,
    enriched,
    isLoading,
    isError,
    refetch,
    isFetching,
    isSearching,
    isDebouncing,
    total,
  } = useLaundryDiscovery(filters);

  return (
    <div className="bg-background">
      <StoresHero />

      <section id="stores" className="scroll-mt-20 bg-surface-gradient py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Partner directory"
            title="WashHouse stores"
            description="Every store is verified before joining. Tap a card to see services, pricing, and book pickup."
          />

          <HomeSearchBar
            value={filters.search}
            onChange={(search) => setFilters((f) => ({ ...f, search }))}
            isSearching={isSearching && (isDebouncing || isFetching)}
          />

          <LaundryFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
            totalCount={isSearching ? total : undefined}
            isLoading={isLoading}
            isFetching={isFetching}
          />

          {isLoading && (
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="status"
              aria-busy="true"
            >
              <span className="sr-only">Loading stores</span>
              {Array.from({ length: 8 }).map((_, i) => (
                <LaundryCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={Store}
              title="Could not load stores"
              description="Check your connection and try again."
              secondaryAction={{
                label: isFetching ? 'Retrying…' : 'Try again',
                onClick: () => void refetch(),
              }}
            />
          )}

          {!isLoading && !isError && enriched.length === 0 && !isSearching && (
            <EmptyState
              icon={MapPin}
              title="No stores in your area yet"
              description="We are expanding to more neighbourhoods. Check back soon."
              action={{ label: 'Refresh', href: '/stores' }}
            />
          )}

          {!isLoading && !isError && isSearching && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              title="No stores match your search"
              description={`We could not find results for "${filters.search.trim()}". Try another name, area, or service.`}
              secondaryAction={{
                label: 'Clear search',
                onClick: () => setFilters((f) => ({ ...f, search: '' })),
              }}
            />
          )}

          {!isLoading && !isError && !isSearching && enriched.length > 0 && filtered.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="No matches for your filters"
              description="Try adjusting rating, distance, or delivery time."
              secondaryAction={{
                label: 'Reset filters',
                onClick: () => setFilters(DEFAULT_FILTERS),
              }}
            />
          )}

          {filtered.length > 0 && (
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="WashHouse partner stores"
            >
              {filtered.map((laundry) => (
                <div key={laundry.id} role="listitem">
                  <LaundryCard laundry={laundry} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <StoresCta />
    </div>
  );
}
