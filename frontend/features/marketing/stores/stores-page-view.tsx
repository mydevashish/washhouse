'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Store } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { StoresCard } from '@/features/marketing/stores/stores-card';
import { StoresCta } from '@/features/marketing/stores/stores-cta';
import { StoresHero } from '@/features/marketing/stores/stores-hero';
import { StoresNearMeControl } from '@/features/marketing/stores/stores-near-me-control';
import { useGeolocation } from '@/hooks/use-geolocation';
import type { ContactInfo } from '@/services/customer-experience';
import { cn } from '@/lib/utils';

const STATIC_STORE_CONTACT: ContactInfo = {
  can_contact: true,
  contact_available: true,
  requires_login: false,
  show_call: true,
  show_whatsapp: true,
  show_callback: false,
  show_directions: true,
  phone: '+919977751133',
  whatsapp_number: '+919977751133',
  whatsapp_url: 'https://wa.me/919977751133',
  address_line: 'Navratna Complex, near Seven Eleven Shop',
  city: 'Udaipur, Rajasthan',
  full_address: 'Navratna Complex, near Seven Eleven Shop, Udaipur, Rajasthan',
  map_url: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
  google_maps_url: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
  apple_maps_url: null,
  geo_url: null,
  latitude: null,
  longitude: null,
  working_hours: { opening: '21 September 2026, 11:00 AM' },
};

const STATIC_STORE: EnrichedLaundry = {
  id: 'washhouse-udaipur',
  name: 'The WashHouse Laundry & Dryclean',
  slug: 'washhouse-udaipur',
  city: 'Udaipur, Rajasthan',
  avg_rating: '0',
  review_count: 0,
  is_verified: true,
  latitude: null,
  longitude: null,
  distanceKm: Number.NaN,
  deliveryHours: 48,
  startPrice: null,
  distanceIsApproximate: true,
  image: '/catalog/services/wash-fold.webp',
};

/**
 * Search + Near me cluster. Sticky under marketing nav on phone/tablet.
 * `compact` only tightens chrome (full-bleed, shadow, pill input) — same height, no IO thrash.
 * Status/errors render full-width under the row so sticky ≤1023px does not clip them.
 */
function StoresFilterCluster({
  search,
  onSearchChange,
  isSearching,
  geoStatus,
  geoError,
  nearMeActive,
  nearMePartial,
  onNearMe,
  onClearNearMe,
  compact,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  geoStatus: ReturnType<typeof useGeolocation>['status'];
  geoError: string | null;
  nearMeActive: boolean;
  nearMePartial: string | null;
  onNearMe: () => void;
  onClearNearMe: () => void;
  compact: boolean;
}) {
  const failed =
    geoStatus === 'denied' ||
    geoStatus === 'unavailable' ||
    geoStatus === 'error';
  const clusterStatus =
    (failed && geoError) ||
    (nearMeActive && nearMePartial) ||
    (nearMeActive ? 'Sorted by distance from your location.' : null);

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
            partialMessage={nearMePartial}
            nearMeActive={nearMeActive}
            hideMessages
            onRequest={onNearMe}
            onClear={onClearNearMe}
            compact={compact}
          />
        </div>
      </div>

      {clusterStatus && (
        <p
          className={cn(
            'flex items-start gap-2 text-muted-foreground',
            compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm',
          )}
          role="status"
          aria-live="polite"
        >
          <span className="min-w-0 flex-1 text-pretty">{clusterStatus}</span>
        </p>
      )}
    </div>
  );
}

export function StoresPageView() {
  const geo = useGeolocation();
  const [search, setSearch] = useState('');

  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const [filtersCompact, setFiltersCompact] = useState(false);

  // Backend store discovery is intentionally disabled while the Udaipur location launches.
  // const discovery = useLaundryDiscovery(filters, { userLocation: geo.position });
  const filtered = search.trim()
    ? STATIC_STORE.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      STATIC_STORE.city.toLowerCase().includes(search.trim().toLowerCase())
      ? [STATIC_STORE]
      : []
    : [STATIC_STORE];
  const nearMeActive = false;
  const nearMePartial = null;
  const sectionDescription =
    "Our Udaipur partner is opening soon. Call, message, or get directions when you're ready.";

  const handleNearMe = () => {
    void geo.request();
  };

  const handleClearNearMe = () => {
    geo.clear();
  };

  // Compact sticky chrome once the filter cluster pins under the nav (phone/tablet only).
  // Top sticky only — MarketingShell bottom CTA stays at z-50 fixed bottom.
  useEffect(() => {
    const el = filterAnchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const mq = window.matchMedia('(max-width: 1023px)');
    let stuck = false;
    const syncCompact = () => {
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
        stuck = !entry.isIntersecting;
        syncCompact();
      },
      {
        rootMargin: `-${navPx}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    io.observe(el);

    const onMqChange = () => {
      syncCompact();
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

          {/* Search and Near me are temporarily disabled for the single launch store. */}
          {/*
          <div ref={filterAnchorRef} className="h-px w-full" aria-hidden />
          <div
            className={cn(
              'sticky top-[var(--nav-height)] z-30',
              'lg:static lg:z-auto',
            )}
            data-stores-sticky-filters={filtersCompact ? 'compact' : 'docked'}
          >
            <StoresFilterCluster
              search={search}
              onSearchChange={setSearch}
              isSearching={false}
              geoStatus={geo.status}
              geoError={geo.errorMessage}
              nearMeActive={nearMeActive}
              nearMePartial={nearMePartial}
              onNearMe={handleNearMe}
              onClearNearMe={handleClearNearMe}
              compact={filtersCompact}
            />
          </div>
          */}

          {filtered.length > 0 && (
            <ul
              className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:gap-6"
              aria-label="WashHouse partner stores"
            >
              {filtered.map((laundry, index) => {
                const featured = index === 0;
                return (
                  <li
                    key={laundry.id}
                    className={cn('min-w-0', featured && 'md:col-span-2')}
                  >
                    <StoresCard
                      laundry={laundry}
                      index={index}
                      variant={featured ? 'featured' : 'default'}
                      contactOverride={STATIC_STORE_CONTACT}
                      details={{
                        address: 'Navratna Complex, near Seven Eleven Shop, Udaipur, Rajasthan',
                        opening: '21 September 2026 at 11:00 AM',
                        mapsUrl: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
                      }}
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
