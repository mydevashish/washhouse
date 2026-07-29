'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Store } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeIn } from '@/features/discover/marketplace/fade-in';
import { enrichLaundry } from '@/features/discover/lib/laundry-meta';
import { StoresCard } from '@/features/marketing/stores/stores-card';
import { StoresCardSkeleton } from '@/features/marketing/stores/stores-card-skeleton';
import {
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundries } from '@/services/laundries';
import { cn } from '@/lib/utils';

const PREVIEW_COUNT = 3;

export function FeaturedStoresTeaser() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
  });

  const preview =
    data?.slice(0, PREVIEW_COUNT).map((laundry, index) => enrichLaundry(laundry, index)) ?? [];

  return (
    <section
      aria-labelledby="featured-stores-title"
      className={cn('bg-muted/30', MARKETING_SECTION_PY)}
    >
      <div className={MARKETING_CONTAINER}>
        {/* No FadeInItem: store cards + Browse CTA stay visible (WCAG 2.4.7). */}
        <FadeIn>
          <SectionHeader
            eyebrow="Stores"
            title="Premium laundries near you"
            description="Every partner is verified before going live. Find a store by neighbourhood and book pickup in minutes."
            align="center"
            className="mb-10"
          />

          {isLoading && preview.length === 0 && (
            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
              role="status"
              aria-busy="true"
            >
              <span className="sr-only">Loading featured stores</span>
              {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <StoresCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={Store}
              title="Could not load stores"
              description="Check your connection and try again, or browse the full store directory."
              className="mx-auto max-w-3xl border-border/60 bg-card/80"
              action={{ label: 'Browse stores', href: '/stores' }}
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
              description="We are onboarding laundries in more neighbourhoods across India. Check the directory for the latest partners."
              className="mx-auto max-w-3xl border-border/60 bg-card/80"
              action={{ label: 'Browse all stores', href: '/stores' }}
            />
          )}

          {preview.length > 0 && (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {preview.map((laundry, index) => (
                <li key={laundry.id} className="min-w-0">
                  <StoresCard laundry={laundry} index={index} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-11 min-h-11 rounded-full">
              <Link href="/stores">
                Browse all stores
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
