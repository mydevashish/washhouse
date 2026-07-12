'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Store } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { PartnerCard } from '@/features/discover/marketplace/partner-card';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundries } from '@/services/laundries';

export function PartnersSection() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
  });

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
            description="Check your internet connection and make sure the app server is running, then try again."
            secondaryAction={{
              label: isFetching ? 'Retrying…' : 'Try again',
              onClick: () => void refetch(),
            }}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={Store}
            title="No partners in your area yet"
            description="We are onboarding laundries in more cities. Check back soon or contact support to request your neighbourhood."
            action={{ label: 'Back to home', href: '/' }}
          />
        )}

        {data && data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((laundry, index) => (
              <FadeInItem key={laundry.id}>
                <PartnerCard laundry={laundry} index={index} />
              </FadeInItem>
            ))}
          </div>
        )}
      </FadeIn>
    </Section>
  );
}
