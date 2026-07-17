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
import { StoresCard } from '@/features/marketing/stores/stores-card';
import { StoresCardSkeleton } from '@/features/marketing/stores/stores-card-skeleton';
import { StoresCta } from '@/features/marketing/stores/stores-cta';
import { StoresHero } from '@/features/marketing/stores/stores-hero';

export function StoresPageView() {
  const [filters, setFilters] = useState<LaundryFilters>({
    ...DEFAULT_FILTERS,
    // Directory mode: do not apply discovery compare caps (distance/price/rating UI removed)
    maxDistance: 50,
    sort: 'top_rated',
  });

  const {
    filtered,
    enriched,
    isLoading,
    isError,
    refetch,
    isFetching,
    isSearching,
    isDebouncing,
  } = useLaundryDiscovery(filters);

  return (
    <div className="bg-background">
      <StoresHero />

      <section id="stores" className="scroll-mt-20 bg-surface-gradient py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Partner directory"
            title="WashHouse stores"
            description="Find a verified partner near you by name or neighbourhood. Services and pricing are the same across stores — pick the location that works for you."
          />

          <HomeSearchBar
            value={filters.search}
            onChange={(search) => setFilters((f) => ({ ...f, search }))}
            isSearching={isSearching && (isDebouncing || isFetching)}
          />

          {isLoading && (
            <div className="space-y-3" role="status" aria-busy="true">
              <span className="sr-only">Loading stores</span>
              {Array.from({ length: 6 }).map((_, i) => (
                <StoresCardSkeleton key={i} />
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
              description={`We could not find results for "${filters.search.trim()}". Try another name or area.`}
              secondaryAction={{
                label: 'Clear search',
                onClick: () => setFilters((f) => ({ ...f, search: '' })),
              }}
            />
          )}

          {filtered.length > 0 && (
            <ul className="space-y-3" aria-label="WashHouse partner stores">
              {filtered.map((laundry) => (
                <li key={laundry.id}>
                  <StoresCard laundry={laundry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <StoresCta />
    </div>
  );
}
