'use client';



import { useState } from 'react';

import { MapPin, Search, Store } from 'lucide-react';



import { BookingFlowSteps } from '@/components/marketplace/booking-flow-steps';

import { SectionHeader } from '@/components/marketplace/section-header';

import { TrustStrip } from '@/components/marketplace/trust-strip';

import { EmptyState } from '@/components/ui/empty-state';

import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';

import { HomeHero } from '@/features/discover/homepage/home-hero';

import { HomeSearchBar } from '@/features/discover/homepage/home-search-bar';

import { HomeTestimonials } from '@/features/discover/homepage/home-testimonials';

import { HomeWhyChooseUs } from '@/features/discover/homepage/home-why-choose-us';

import {

  DEFAULT_FILTERS,

  type LaundryFilters,

} from '@/features/discover/listing/filter-laundries';

import { LaundryCard } from '@/features/discover/listing/laundry-card';

import { LaundryCardSkeleton } from '@/features/discover/listing/laundry-card-skeleton';

import { LaundryFiltersBar } from '@/features/discover/listing/laundry-filters';



export function MarketplaceHomepage() {

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

    <div className="min-h-screen bg-background pb-safe-nav sm:pb-0">

      <HomeHero />

      <TrustStrip />



      <section className="border-b border-border bg-card py-12 sm:py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <SectionHeader

            eyebrow="How it works"

            title="Book in 4 simple steps"

            description="No confusion — pick a laundry, add services, schedule pickup, and track until delivery."

            align="center"

            className="mb-10"

          />

          <BookingFlowSteps />

        </div>

      </section>



      <section

        id="laundries"

        aria-labelledby="laundries-heading"

        className="scroll-mt-20 bg-surface-gradient py-12 sm:py-16 lg:py-20"

      >

        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">

          <SectionHeader

            eyebrow="Near you"

            title="Premium laundries nearby"

            description="Choose a laundry to see available services and pricing. Every store is verified before joining DLM."

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

          />



          {isLoading && (

            <div

              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

              aria-busy="true"

              aria-label="Loading laundries"

            >

              {Array.from({ length: 8 }).map((_, i) => (

                <LaundryCardSkeleton key={i} />

              ))}

            </div>

          )}



          {isError && (

            <EmptyState

              icon={Store}

              title="Could not load laundries"

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

              title="No laundries in your area yet"

              description="We are expanding to more neighbourhoods. Check back soon."

              action={{ label: 'Refresh', href: '/discover' }}

            />

          )}



          {!isLoading && !isError && isSearching && filtered.length === 0 && (

            <EmptyState

              icon={Search}

              title="No laundries match your search"

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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {filtered.map((laundry) => (

                <LaundryCard key={laundry.id} laundry={laundry} />

              ))}

            </div>

          )}

        </div>

      </section>



      <HomeWhyChooseUs />

      <HomeTestimonials />

    </div>

  );

}

