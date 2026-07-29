'use client';

import { useState } from 'react';
import { MapPin, Search, Store } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';
import {
  DEFAULT_FILTERS,
  type LaundryFilters,
} from '@/features/discover/listing/filter-laundries';
import { LaundryFiltersBar } from '@/features/discover/listing/laundry-filters';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { PartnerCard } from '@/features/discover/marketplace/partner-card';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';

export function PartnersSection() {
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
    <Section id="partners" tone="brand" ariaLabel="Nearby laundry partners">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="Partners"
            title="Choose a laundry near you"
            description="Each partner sets their own services and pricing. Tap a store to view services, reviews, and book pickup."
            helper="Sign in only when you are ready to place an order — browsing is free."
            align="left"
          />
        </FadeInItem>

        <FadeInItem>
          <InfoBanner icon={MapPin} title="How to book" className="mb-8 sm:mb-10">
            Select a laundry → pick services & quantity → choose your address → confirm pickup time.
            You can browse everything without an account.
          </InfoBanner>
        </FadeInItem>

        <FadeInItem>
          <div className="mb-6 max-w-xl">
            <Label htmlFor="partners-search" className="font-semibold">
              Search
            </Label>
            <Input
              id="partners-search"
              type="search"
              placeholder="Name, area, service, or tag…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="mt-2"
              aria-describedby="partners-search-hint"
            />
            <p id="partners-search-hint" className="mt-1 text-sm text-fg-1">
              {isSearching && isLoading
                ? 'Searching…'
                : isSearching
                  ? `${total} result${total === 1 ? '' : 's'} from server`
                  : 'Server search runs as you type'}
            </p>
          </div>
        </FadeInItem>

        <FadeInItem>
          <div className="mb-8">
            <LaundryFiltersBar
              filters={filters}
              onChange={setFilters}
              resultCount={filtered.length}
              totalCount={isSearching ? total : undefined}
              isLoading={isLoading}
              isFetching={isFetching}
            />
          </div>
        </FadeInItem>

        {isLoading && (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Loading laundries"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-bg-0 shadow-soft">
                <div className="aspect-[16/10] animate-pulse bg-bg-2" />
                <div className="space-y-3 p-6">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-bg-2" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-bg-2" />
                  <div className="h-4 w-full animate-pulse rounded bg-bg-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={Store}
            title="Could not load laundries"
            description={
              isFetching
                ? 'Still trying to reach the server — hosted APIs can take up to a minute to wake up.'
                : 'Check your internet connection and make sure the app server is running, then try again.'
            }
            secondaryAction={{
              label: isFetching ? 'Retrying…' : 'Try again',
              onClick: () => void refetch(),
            }}
          />
        )}

        {!isLoading && !isError && enriched.length === 0 && !isSearching && (
          <EmptyState
            icon={Store}
            title="No partners in your area yet"
            description="We are onboarding laundries in more cities. Check back soon or contact support to request your neighbourhood."
            action={{ label: 'Back to home', href: '/' }}
          />
        )}

        {!isLoading && !isError && isSearching && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matches for your search"
            description="Try a different store name, neighbourhood, or service."
            secondaryAction={{
              label: 'Clear search',
              onClick: () => setFilters((f) => ({ ...f, search: '' })),
            }}
          />
        )}

        {!isLoading && !isError && !isSearching && enriched.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No laundries match your filters"
            description="Try widening distance or price filters, or clear your search."
            secondaryAction={{
              label: 'Reset filters',
              onClick: () => setFilters(DEFAULT_FILTERS),
            }}
          />
        )}

        {filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((laundry, index) => (
              // No FadeInItem: opacity:0 until in-view hides focusable PartnerCard links (WCAG 2.4.7).
              <PartnerCard key={laundry.id} laundry={laundry} index={index} />
            ))}
          </div>
        )}
      </FadeIn>
    </Section>
  );
}
