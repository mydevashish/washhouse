'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  enrichLaundry,
  pickNearestOrFeatured,
} from '@/features/discover/lib/laundry-meta';
import { QuickPickCompactRow } from '@/features/marketing/stores/quick-pick-compact-row';
import { QuickPickSkeleton } from '@/features/marketing/stores/quick-pick-skeleton';
import { QuickPickSpotlight } from '@/features/marketing/stores/quick-pick-spotlight';
import { QuickPickStatusChip } from '@/features/marketing/stores/quick-pick-status-chip';
import {
  useGeolocation,
  type GeolocationStatus,
} from '@/hooks/use-geolocation';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { MARKETING_STORES_HREF } from '@/lib/navigation/marketing-nav';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { listLaundries } from '@/services/laundries';

const PREVIEW_COUNT = 3;

type StoresQuickPickSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional extra callback when a store cover/name navigates to the storefront. */
  onNavigate?: () => void;
};

function quickPickSubtitle(
  geoStatus: GeolocationStatus,
  usingNearMe: boolean,
): string {
  if (usingNearMe) {
    return 'Closest partners — call, message, or get location from the card.';
  }
  if (geoStatus === 'idle' || geoStatus === 'pending') {
    return 'Showing featured picks while we check your location…';
  }
  if (
    geoStatus === 'denied' ||
    geoStatus === 'unavailable' ||
    geoStatus === 'error'
  ) {
    return "Picks I'd start with. Location off — see all stores to browse by area.";
  }
  return "Picks I'd start with. Allow location for nearest, or see all stores.";
}

/**
 * Bottom sheet listing up to 3 nearest (GPS) or featured stores.
 * Mount only after first open — keeps sticky CTA bundle light (no maps SDK).
 * Phone: spotlight + compact rows. Tablet md+: 2-column curated picker.
 */
export function StoresQuickPickSheet({
  open,
  onOpenChange,
  onNavigate,
}: StoresQuickPickSheetProps) {
  const reduceMotion = usePrefersReducedMotion();
  const geo = useGeolocation();

  const handleStoreNavigate = () => {
    onNavigate?.();
    onOpenChange(false);
  };

  const listQ = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
    enabled: open,
  });

  useEffect(() => {
    if (!open || geo.status !== 'idle') return;
    void geo.request();
  }, [open, geo.status, geo.request]);

  const preview = useMemo(() => {
    const picked = pickNearestOrFeatured(listQ.data ?? [], geo.position, PREVIEW_COUNT);
    return picked.map((laundry, index) =>
      enrichLaundry(laundry, index, geo.position),
    );
  }, [listQ.data, geo.position]);

  const spotlight = preview[0] ?? null;
  const secondary = preview.slice(1);

  const usingNearMe =
    Boolean(geo.position) &&
    preview.length > 0 &&
    preview.some((l) => !l.distanceIsApproximate);

  const nearDistanceKm =
    usingNearMe && spotlight && !spotlight.distanceIsApproximate
      ? spotlight.distanceKm
      : null;

  const showStatusChip =
    !listQ.isLoading &&
    preview.length > 0 &&
    (usingNearMe || geo.status !== 'pending');

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={!reduceMotion}
    >
      <DrawerContent
        className={cn(
          'mx-auto max-h-[85vh] w-full max-w-lg md:max-w-2xl',
          reduceMotion && '[&_[data-vaul-handle]]:transition-none',
        )}
        aria-describedby="stores-quick-pick-desc"
      >
        <DrawerHeader className="gap-3 text-left sm:text-left">
          <div className="flex flex-wrap items-center gap-2 gap-y-2">
            <DrawerTitle className="text-xl">Nearby stores</DrawerTitle>
            {showStatusChip && (
              <QuickPickStatusChip
                nearYou={usingNearMe}
                distanceKm={nearDistanceKm}
              />
            )}
          </div>
          <DrawerDescription id="stores-quick-pick-desc">
            {quickPickSubtitle(geo.status, usingNearMe)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="pb-2">
          {listQ.isLoading && <QuickPickSkeleton />}

          {listQ.isError && (
            <p
              className="px-1 py-6 text-center text-sm text-muted-foreground"
              role="alert"
            >
              Couldn&apos;t load stores. Try the full directory.
            </p>
          )}

          {!listQ.isLoading && !listQ.isError && preview.length === 0 && (
            <div className="px-2 py-10 text-center" role="status">
              <p className="text-balance text-2xl font-semibold tracking-tight text-foreground">
                No stores nearby yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Browse the full directory when you&apos;re ready.
              </p>
            </div>
          )}

          {spotlight && (
            <div
              className={cn(
                'flex flex-col gap-3',
                secondary.length > 0 &&
                  'md:grid md:grid-cols-[1.15fr_1fr] md:items-start md:gap-4',
              )}
              aria-label="Quick pick stores"
            >
              <QuickPickSpotlight
                laundry={spotlight}
                onNavigate={handleStoreNavigate}
              />

              {secondary.length > 0 && (
                <ul
                  className="flex flex-col gap-2 md:gap-3"
                  aria-label="More nearby stores"
                >
                  {secondary.map((laundry, i) => (
                    <QuickPickCompactRow
                      key={laundry.id}
                      laundry={laundry}
                      index={i}
                      onNavigate={handleStoreNavigate}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DrawerFooter className="gap-2 border-0 pt-2 md:flex-row md:items-center">
          <Button
            asChild
            size="lg"
            className="h-12 min-h-12 w-full gap-2 rounded-full md:flex-1"
          >
            <Link href={MARKETING_STORES_HREF} onClick={() => onOpenChange(false)}>
              See all stores
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-11 min-h-11 w-full md:w-auto md:min-w-[6rem] md:px-6"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
