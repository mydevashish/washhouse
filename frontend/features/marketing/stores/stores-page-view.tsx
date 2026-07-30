'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Store } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';
import {
  DEFAULT_FILTERS,
  type LaundryFilters,
} from '@/features/discover/listing/filter-laundries';
import { StoresCard } from '@/features/marketing/stores/stores-card';
import { StoresCardSkeleton } from '@/features/marketing/stores/stores-card-skeleton';
import { StoresCta } from '@/features/marketing/stores/stores-cta';
import { StoresHero } from '@/features/marketing/stores/stores-hero';
import { StoresNearMeControl } from '@/features/marketing/stores/stores-near-me-control';
import { useGeolocation } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

/**
 * Search + Near me cluster. Sticky under marketing nav on phone/tablet.
 * `compact` only tightens chrome (full-bleed, shadow, pill input) — same height, no IO thrash.
 */
function StoresFilterCluster({
  search,
  onSearchChange,
  isSearching,
  geoStatus,
  geoError,
  onNearMe,
  onClearNearMe,
  compact,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  geoStatus: ReturnType<typeof useGeolocation>['status'];
  geoError: string | null;
  onNearMe: () => void;
  onClearNearMe: () => void;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        'border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85',
        'transition-[box-shadow,border-radius,padding] duration-200 ease-out motion-reduce:transition-none',
        compact
          ? '-mx-4 border-b px-4 py-2.5 shadow-sm sm:-mx-6 sm:px-6'
          : 'rounded-xl border p-3 shadow-soft sm:p-4',
      )}
      role="search"
      aria-label="Store filters"
    >
      <div
        className={cn(
          'flex gap-2 sm:gap-3',
          compact
            ? 'flex-row flex-nowrap items-end'
            : 'flex-col md:flex-row md:items-end',
        )}
      >
        <div className="min-w-0 flex-1">
          <Label
            htmlFor="laundry-search"
            className={cn(
              'font-semibold text-foreground',
              compact ? 'text-xs' : 'text-sm sm:text-base',
            )}
          >
            Search laundries
          </Label>
          <p
            id="laundry-search-hint"
            className={cn(
              'text-muted-foreground',
              compact ? 'sr-only' : 'mt-0.5 text-xs sm:text-sm',
            )}
          >
            {isSearching
              ? 'Searching…'
              : 'Store name, neighbourhood, or area'}
          </p>
          <div className={cn('relative', compact ? 'mt-1.5' : 'mt-2.5')}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:h-5 sm:w-5"
              aria-hidden
            />
            <Input
              id="laundry-search"
              type="search"
              placeholder="e.g. Sparkle Laundry, Koramangala…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                'h-11 min-h-11 pl-9 sm:pl-10',
                compact && 'rounded-full',
              )}
              aria-describedby="laundry-search-hint"
            />
          </div>
        </div>

        <div className="shrink-0">
          <StoresNearMeControl
            status={geoStatus}
            errorMessage={geoError}
            onRequest={onNearMe}
            onClear={onClearNearMe}
            compact={compact}
          />
        </div>
      </div>
    </div>
  );
}

export function StoresPageView() {
  const geo = useGeolocation();
  const [filters, setFilters] = useState<LaundryFilters>({
    ...DEFAULT_FILTERS,
    // Directory mode: do not apply discovery compare caps (distance/price/rating UI removed)
    maxDistance: 50,
    sort: 'top_rated',
  });

  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const [filtersCompact, setFiltersCompact] = useState(false);

  const {
    filtered,
    enriched,
    isPending,
    isError,
    refetch,
    isFetching,
    isSearching,
    isDebouncing,
  } = useLaundryDiscovery(filters, { userLocation: geo.position });

  // Initial paint only — never skeleton on search debounce / background refetch (discover bug class).
  const showSkeletons = !isError && enriched.length === 0 && (isPending || isFetching);

  const isNearest = filters.sort === 'nearest';
  const sectionDescription = isNearest
    ? "Here's what's closest to you. Services and pricing are the same across stores — call, message, or get directions for the one that works."
    : "Find a verified partner near you by name or neighbourhood. Services and pricing are the same across stores — call, message, or get directions when you're ready.";

  const handleNearMe = async () => {
    const pos = await geo.request();
    if (pos) {
      setFilters((f) => ({
        ...f,
        sort: 'nearest',
        maxDistance: 50,
      }));
    }
  };

  const handleClearNearMe = () => {
    geo.clear();
    setFilters((f) => ({
      ...f,
      sort: 'top_rated',
    }));
  };

  // Compact sticky chrome once the filter cluster pins under the nav (phone/tablet only).
  // Top sticky only — MarketingShell bottom CTA stays at z-50 fixed bottom.
  useEffect(() => {
    const el = filterAnchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const mq = window.matchMedia('(max-width: 1023px)');
    const syncCompact = (stuck: boolean) => {
      setFiltersCompact(mq.matches && stuck);
    };

    // IntersectionObserver rootMargin only accepts px/% — resolve --nav-height.
    const rawNav =
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height').trim() ||
      '3.25rem';
    const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const navPx = rawNav.endsWith('rem')
      ? parseFloat(rawNav) * rootFs
      : parseFloat(rawNav) || 52;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        syncCompact(!entry.isIntersecting);
      },
      {
        rootMargin: `-${navPx}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    io.observe(el);

    const onMqChange = () => {
      if (!mq.matches) setFiltersCompact(false);
    };
    mq.addEventListener('change', onMqChange);

    return () => {
      io.disconnect();
      mq.removeEventListener('change', onMqChange);
    };
  }, []);

  return (
    <div className="bg-background">
      <StoresHero />

      <section id="stores" className="scroll-mt-20 bg-surface-gradient py-8 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Partner directory"
            title="WashHouse stores"
            description={sectionDescription}
          />

          {/* Sentinel sits above sticky cluster so IO can detect pin-under-nav */}
          <div ref={filterAnchorRef} className="h-px w-full" aria-hidden />
          <div
            className={cn(
              'sticky top-[var(--nav-height)] z-30',
              // Desktop lg+: stay in-flow chrome only (no compact sticky fight with wide layout)
              'lg:static lg:z-auto',
            )}
            data-stores-sticky-filters={filtersCompact ? 'compact' : 'docked'}
          >
            <StoresFilterCluster
              search={filters.search}
              onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
              isSearching={isSearching && (isDebouncing || isFetching)}
              geoStatus={geo.status}
              geoError={geo.errorMessage}
              onNearMe={() => void handleNearMe()}
              onClearNearMe={handleClearNearMe}
              compact={filtersCompact}
            />
          </div>

          {showSkeletons && (
            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6"
              role="status"
              aria-busy="true"
            >
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

          {!showSkeletons && !isError && enriched.length === 0 && !isSearching && (
            <EmptyState
              title="No stores in your area yet"
              description="We're expanding to more neighbourhoods. Check back soon, or refresh to try again."
              action={{ label: 'Refresh', href: '/stores' }}
            />
          )}

          {!showSkeletons && !isError && isSearching && filtered.length === 0 && (
            <EmptyState
              title="No stores match your search"
              description={`Nothing found for "${filters.search.trim()}". Try another name or neighbourhood.`}
              secondaryAction={{
                label: 'Clear search',
                onClick: () => setFilters((f) => ({ ...f, search: '' })),
              }}
            />
          )}

          {filtered.length > 0 && (
            <ul
              className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:gap-6"
              aria-label="WashHouse partner stores"
            >
              {filtered.map((laundry, index) => {
                const featured = isNearest && index === 0;
                return (
                  <li
                    key={laundry.id}
                    className={cn('min-w-0', featured && 'md:col-span-2')}
                  >
                    <StoresCard
                      laundry={laundry}
                      index={index}
                      variant={featured ? 'featured' : 'default'}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <StoresCta />
    </div>
  );
}
