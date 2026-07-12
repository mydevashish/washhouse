'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Store } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { PartnerCard } from '@/features/discover/marketplace/partner-card';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundries } from '@/services/laundries';

const PREVIEW_COUNT = 3;

export function FeaturedStoresTeaser() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
  });

  const preview = data?.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <section
      aria-labelledby="featured-stores-title"
      className="border-t border-border bg-surface-gradient py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <SectionHeader
              eyebrow="Stores"
              title="Premium laundries near you"
              description="Every partner is verified before going live. Compare ratings, pricing, and book pickup in minutes."
              align="center"
              className="mb-10"
            />
          </FadeInItem>

          {isLoading && (
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading featured stores"
            >
              {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                >
                  <div className="aspect-[16/10] animate-pulse bg-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
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

          {!isLoading && !isError && preview.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="Stores coming to your area soon"
              description="We are onboarding laundries in more neighbourhoods across India."
              action={{ label: 'Check discover', href: '/discover' }}
            />
          )}

          {preview.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((laundry, index) => (
                <FadeInItem key={laundry.id}>
                  <PartnerCard laundry={laundry} index={index} />
                </FadeInItem>
              ))}
            </div>
          )}

          <FadeInItem>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/stores">
                  Browse all stores
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
