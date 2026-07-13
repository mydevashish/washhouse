'use client';



import { useState } from 'react';

import { MapPin, Search, Store } from 'lucide-react';



import { EmptyState } from '@/components/ui/empty-state';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';

import { LaundryCard } from '@/features/discover/listing/laundry-card';

import {

  DEFAULT_FILTERS,

  type LaundryFilters,

} from '@/features/discover/listing/filter-laundries';

import { LaundryFiltersBar } from '@/features/discover/listing/laundry-filters';

import { LaundryCardSkeleton } from '@/features/discover/listing/laundry-card-skeleton';



export function LaundryListing() {

  const [filters, setFilters] = useState<LaundryFilters>(DEFAULT_FILTERS);

  const {

    filtered,

    enriched,

    isLoading,

    isError,

    refetch,

    isFetching,

    isSearching,

    total,

  } = useLaundryDiscovery(filters);



  return (

    <div className="min-h-screen bg-bg-1">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        <header className="mb-8 max-w-2xl">

          <p className="text-sm font-semibold text-brand-500">Step 1 of 5</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg-0 sm:text-4xl">

            Choose a laundry

          </h1>

          <p className="mt-2 text-base text-fg-1 sm:text-lg">

            Compare trusted partners near you. Services and pricing appear after you pick a store.

          </p>

        </header>



        <div className="mb-6 max-w-xl">

          <Label htmlFor="listing-search" className="font-semibold">

            Search

          </Label>

          <Input

            id="listing-search"

            type="search"

            placeholder="Name, area, service, or tag…"

            value={filters.search}

            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}

            className="mt-2"

            aria-describedby="listing-search-hint"

          />

          <p id="listing-search-hint" className="mt-1 text-sm text-fg-1">

            {isSearching && isLoading

              ? 'Searching…'

              : isSearching

                ? `${total} result${total === 1 ? '' : 's'} from server`

                : 'Server search runs as you type'}

          </p>

        </div>



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

            className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

            aria-busy="true"

            aria-label="Loading laundries"

          >

            {Array.from({ length: 4 }).map((_, i) => (

              <LaundryCardSkeleton key={i} />

            ))}

          </div>

        )}



        {isError && (

          <div className="mt-8">

            <EmptyState

              icon={Store}

              title="Could not load laundries"

              description={
                isFetching
                  ? 'Still trying to reach the server — hosted APIs can take up to a minute to wake up.'
                  : 'The server may still be starting. Wait a moment, then try again.'
              }

              secondaryAction={{

                label: isFetching ? 'Retrying…' : 'Try again',

                onClick: () => void refetch(),

              }}

            />

          </div>

        )}



        {!isLoading && !isError && enriched.length === 0 && !isSearching && (

          <div className="mt-8">

            <EmptyState

              icon={MapPin}

              title="No laundries available in your area yet"

              description="We are expanding to more neighbourhoods. Check back soon or try another city."

              action={{ label: 'Refresh', href: '/discover' }}

            />

          </div>

        )}



        {!isLoading && !isError && isSearching && filtered.length === 0 && (

          <div className="mt-8">

            <EmptyState

              icon={Search}

              title="No matches for your search"

              description="Try a different store name, neighbourhood, or service."

              secondaryAction={{

                label: 'Clear search',

                onClick: () => setFilters((f) => ({ ...f, search: '' })),

              }}

            />

          </div>

        )}



        {!isLoading && !isError && !isSearching && enriched.length > 0 && filtered.length === 0 && (

          <div className="mt-8">

            <EmptyState

              icon={MapPin}

              title="No laundries match your filters"

              description="Try widening distance or price filters, or clear your search."

              secondaryAction={{

                label: 'Reset filters',

                onClick: () => setFilters(DEFAULT_FILTERS),

              }}

            />

          </div>

        )}



        {filtered.length > 0 && (

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filtered.map((laundry) => (

              <LaundryCard key={laundry.id} laundry={laundry} />

            ))}

          </div>

        )}

      </div>

    </div>

  );

}

