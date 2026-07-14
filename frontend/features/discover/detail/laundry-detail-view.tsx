'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Store } from 'lucide-react';

import { BookingFlowSteps } from '@/components/marketplace/booking-flow-steps';
import { OfflineBookingContactPanel } from '@/components/marketplace/offline-booking-contact-panel';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { goToCheckout } from '@/features/checkout/lib/navigate';
import { LaundryDetailHeader } from '@/features/discover/detail/laundry-detail-header';
import { LaundryDetailSkeleton } from '@/features/discover/detail/laundry-detail-skeleton';
import {
  LaundryDetailTabs,
  type LaundryTabId,
} from '@/features/discover/detail/laundry-detail-tabs';
import { LaundryInformationTab } from '@/features/discover/detail/laundry-information-tab';
import { LaundryOverviewTab } from '@/features/discover/detail/laundry-overview-tab';
import { LaundryReviewsTab } from '@/features/discover/detail/laundry-reviews-tab';
import { LaundryServicesTab } from '@/features/discover/detail/laundry-services-tab';
import { OrderSummaryMobile } from '@/features/discover/detail/order-summary-mobile';
import {
  OrderSummarySidebar,
  SignInPrompt,
} from '@/features/discover/detail/order-summary-sidebar';
import { StorefrontContactSection } from '@/features/storefront/storefront-contact-section';
import {
  getLaundryImage,
  getLaundryMeta,
  minServicePrice,
} from '@/features/discover/lib/laundry-meta';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { getLaundry, listReviews, type LaundryServiceItem } from '@/services/laundries';
import { useAuthStore } from '@/store/auth.store';

export function LaundryDetailView({ laundryId }: { laundryId: string }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { enabled: onlineBookingEnabled, isLoading: onlineBookingLoading } = useOnlineBookingEnabled();
  const [tab, setTab] = useState<LaundryTabId>('services');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const laundryQ = useQuery({
    queryKey: queryKeys.laundry(laundryId),
    queryFn: () => getLaundry(laundryId),
    staleTime: STALE.laundryDetail,
  });
  const reviewsQ = useQuery({
    queryKey: queryKeys.reviews(laundryId),
    queryFn: () => listReviews(laundryId),
    staleTime: STALE.reviews,
    enabled: tab === 'reviews',
  });

  const selectedCount = useMemo(
    () => Object.values(quantities).filter((q) => q > 0).length,
    [quantities],
  );

  function startCheckout() {
    if (!onlineBookingEnabled) return;
    goToCheckout(router, laundryId, quantities, { signedIn: Boolean(accessToken) });
  }

  if (laundryQ.isLoading) return <LaundryDetailSkeleton />;

  if (laundryQ.error || !laundryQ.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          icon={Store}
          title="Laundry not found"
          description="This store may have been removed or the link is incorrect."
          action={{ label: 'Browse laundries', href: '/discover' }}
        />
      </div>
    );
  }

  const laundry = laundryQ.data;
  const meta = getLaundryMeta(laundry.slug);
  const coverImage = getLaundryImage(laundry.slug, 0);
  const services = laundry.services.filter((s) => s.is_active);
  const startPrice = minServicePrice(services);
  const rating = Number(laundry.avg_rating);

  function setQuantity(svc: LaundryServiceItem, qty: number) {
    setQuantities((prev) => ({
      ...prev,
      [svc.id]: Math.max(0, Math.min(99, qty)),
    }));
  }

  function setQty(svc: LaundryServiceItem, delta: number) {
    setQuantity(svc, (quantities[svc.id] ?? 0) + delta);
  }

  const offlineMode = !onlineBookingLoading && !onlineBookingEnabled;
  const onlineMode = !onlineBookingLoading && onlineBookingEnabled;
  const showMobileSummary = tab === 'services' && onlineMode && selectedCount > 0;
  const showOfflineMobileBar = tab === 'services' && offlineMode;

  return (
    <div
      className={`min-h-screen bg-background ${
        showMobileSummary || showOfflineMobileBar
          ? 'pb-[max(8rem,calc(7.5rem+env(safe-area-inset-bottom,0px)))]'
          : 'pb-safe-nav'
      } lg:pb-12`}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LaundryDetailHeader
          laundry={laundry}
          coverImage={coverImage}
          meta={meta}
          startPrice={startPrice}
        />

        {tab === 'services' && onlineMode && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">You are on step 2 of 4</p>
            <BookingFlowSteps current={2} compact />
          </div>
        )}

        <div className="mt-8">
          <LaundryDetailTabs
            active={tab}
            onChange={setTab}
            reviewCount={laundry.review_count}
          />
        </div>

        <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {tab === 'overview' && (
              <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
                <LaundryOverviewTab
                  laundry={laundry}
                  startPrice={startPrice}
                  onSelectServices={() => setTab('services')}
                />
              </div>
            )}

            {tab === 'services' && (
              <div id="panel-services" role="tabpanel" aria-labelledby="tab-services">
                {offlineMode && (
                  <OfflineBookingContactPanel
                    laundryId={laundryId}
                    laundryName={laundry.name}
                    className="mb-6 lg:hidden"
                  />
                )}
                {onlineMode && (
                  <StorefrontContactSection
                    laundryId={laundryId}
                    laundryName={laundry.name}
                    className="mb-6 lg:hidden"
                  />
                )}
                <LaundryServicesTab
                  services={services}
                  quantities={quantities}
                  onSelect={(svc) => setQuantity(svc, 1)}
                  onIncrement={(svc) => setQty(svc, 1)}
                  onDecrement={(svc) => setQty(svc, -1)}
                  onQuantityChange={setQuantity}
                  selectedCount={selectedCount}
                  onCheckout={startCheckout}
                  browseOnly={onlineBookingLoading || offlineMode}
                />
              </div>
            )}

            {tab === 'reviews' && (
              <div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews">
                <LaundryReviewsTab
                  reviews={reviewsQ.data}
                  isLoading={reviewsQ.isLoading}
                  avgRating={rating}
                  reviewCount={laundry.review_count}
                />
              </div>
            )}

            {tab === 'information' && (
              <div id="panel-information" role="tabpanel" aria-labelledby="tab-information">
                <LaundryInformationTab laundry={laundry} />
              </div>
            )}
          </div>

          {tab === 'services' && (
            <aside className="mt-8 hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {offlineMode ? (
                  <OfflineBookingContactPanel
                    laundryId={laundryId}
                    laundryName={laundry.name}
                    variant="sidebar"
                  />
                ) : (
                  <>
                    <OrderSummarySidebar services={services} quantities={quantities}>
                      {!accessToken && selectedCount > 0 && <SignInPrompt />}
                    </OrderSummarySidebar>
                    <StorefrontContactSection
                      laundryId={laundryId}
                      laundryName={laundry.name}
                    />
                    {selectedCount > 0 && (
                      <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        onClick={startCheckout}
                      >
                        {accessToken ? 'Continue to checkout' : 'Sign in to checkout'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {showMobileSummary && (
        <OrderSummaryMobile
          services={services}
          quantities={quantities}
          accessToken={accessToken}
          onContinue={startCheckout}
          continueLabel={accessToken ? 'Checkout' : 'Sign in'}
        />
      )}

      {showOfflineMobileBar && (
        <OfflineBookingContactPanel
          laundryId={laundryId}
          laundryName={laundry.name}
          variant="mobile-bar"
        />
      )}
    </div>
  );
}
