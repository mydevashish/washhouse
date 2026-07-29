'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import {
  BadgeCheck,
  Clock,
  MapPin,
  Shield,
  Star,
  Truck,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OfflineBookingContactPanel } from '@/components/marketplace/offline-booking-contact-panel';
import { Badge } from '@/components/ui/badge';
import { ClientLocaleNumber } from '@/components/ui/client-locale-number';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LaundryDetailView } from '@/features/discover/detail/laundry-detail-view';
import { LaundryReviewsTab } from '@/features/discover/detail/laundry-reviews-tab';
import { ServiceCatalogBrowser } from '@/features/discover/detail/service-catalog-browser';
import { LaundryPriceListSection } from '@/features/laundry-price-list';
import { StorefrontContactSection } from '@/features/storefront/storefront-contact-section';
import { StorefrontQuestionsSection } from '@/features/storefront/storefront-questions-section';
import { OrderSummaryMobile } from '@/features/discover/detail/order-summary-mobile';
import { OrderSummarySidebar, SignInPrompt } from '@/features/discover/detail/order-summary-sidebar';
import { getLaundryInitials } from '@/features/discover/detail/service-icons';
import { goToCheckout } from '@/features/checkout/lib/navigate';
import {
  deliveryLabel,
  getLaundryImage,
  getLaundryMeta,
  minServicePrice,
} from '@/features/discover/lib/laundry-meta';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { listReviews } from '@/services/laundries';
import {
  getPublicStorefront,
  resolveStorefrontImage,
} from '@/services/storefront';
import { trackStoreView } from '@/services/customer-experience';
import type { LaundryServiceItem } from '@/services/laundries';
import { useAuthStore } from '@/store/auth.store';

function videoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id =
        u.searchParams.get('v') ??
        (u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.pathname.split('/').pop());
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function StorefrontSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function LaundryStorefrontView({ laundryId }: { laundryId: string }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { enabled: onlineBookingEnabled, isLoading: onlineBookingLoading } = useOnlineBookingEnabled();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const storefrontQ = useQuery({
    queryKey: queryKeys.laundryStorefront(laundryId),
    queryFn: () => getPublicStorefront(laundryId),
    staleTime: STALE.laundryDetail,
    retry: false,
  });

  useEffect(() => {
    if (storefrontQ.data) void trackStoreView(laundryId).catch(() => undefined);
  }, [laundryId, storefrontQ.data]);

  const reviewsQ = useQuery({
    queryKey: queryKeys.reviews(laundryId),
    queryFn: () => listReviews(laundryId),
    staleTime: STALE.reviews,
    enabled: Boolean(storefrontQ.data),
  });

  const selectedCount = useMemo(
    () => Object.values(quantities).filter((q) => q > 0).length,
    [quantities],
  );

  if (storefrontQ.isLoading) return <StorefrontSkeleton />;

  if (storefrontQ.isError || !storefrontQ.data) {
    return <LaundryDetailView laundryId={laundryId} />;
  }

  const { storefront: sf, laundry, orders_completed } = storefrontQ.data;
  const services = laundry.services.filter((s) => s.is_active) as LaundryServiceItem[];
  const startPrice = minServicePrice(services);
  const rating = Number(laundry.avg_rating);
  const meta = getLaundryMeta(laundry.slug);
  const primary = sf.brand_primary ?? '#1e3a5f';
  const secondary = sf.brand_secondary ?? '#c9a227';
  const cover = resolveStorefrontImage(sf.cover_url) || resolveStorefrontImage(sf.gallery[0]?.url);
  const featured = sf.gallery.find((g) => g.is_featured) ?? sf.gallery[0];
  const coverSrc =
    cover ||
    (featured ? resolveStorefrontImage(featured.url) : '') ||
    getLaundryImage(laundry.slug, 0);
  const todayHours = (() => {
    if (!sf.working_hours) return null;
    const day = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
    return sf.working_hours[day] ?? sf.working_hours[day.toLowerCase()] ?? null;
  })();

  const offlineMode = !onlineBookingLoading && !onlineBookingEnabled;
  const onlineMode = !onlineBookingLoading && onlineBookingEnabled;
  const showMobileSummary = onlineMode && selectedCount > 0;
  const showOfflineMobileBar = offlineMode;
  const bookCtaLabel = onlineBookingLoading
    ? 'See full menu'
    : onlineMode
      ? 'Schedule pickup'
      : 'See full menu';
  const heroCtaLabel = onlineMode && !onlineBookingLoading ? 'Schedule pickup' : 'See full menu';

  function startCheckout() {
    if (!onlineBookingEnabled) return;
    goToCheckout(router, laundryId, quantities, { signedIn: Boolean(accessToken) });
  }

  function setQuantity(svc: LaundryServiceItem, qty: number) {
    setQuantities((prev) => ({ ...prev, [svc.id]: Math.max(0, Math.min(99, qty)) }));
  }

  function scrollToServices() {
    document.getElementById('storefront-services')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div
      className={`min-h-screen bg-background ${showMobileSummary || showOfflineMobileBar ? 'pb-[max(4.5rem,calc(4rem+env(safe-area-inset-bottom,0px)))] sm:pb-0' : ''}`}
      style={
        {
          '--store-primary': primary,
          '--store-accent': secondary,
        } as React.CSSProperties
      }
    >
      {/* Hero — who is this laundry */}
      <section className="relative" aria-labelledby="storefront-title">
        <div className="relative aspect-[5/3] max-h-[320px] w-full overflow-hidden bg-muted sm:aspect-[21/9] sm:max-h-[380px]">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--store-primary)] to-[var(--store-accent)]/80 text-primary-foreground">
              <span className="text-6xl font-bold">{getLaundryInitials(laundry.name)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/25 to-transparent" aria-hidden />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="-mt-16 relative flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-4 border-background text-lg font-bold text-primary-foreground shadow-lg"
                style={{ background: primary }}
                aria-hidden
              >
                {sf.logo_url ? (
                  <Image
                    src={resolveStorefrontImage(sf.logo_url)}
                    alt=""
                    width={96}
                    height={96}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  getLaundryInitials(laundry.name)
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {laundry.is_verified && (
                    <Badge className="border-0 bg-card/90 text-foreground">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5 text-success" aria-hidden />
                      Verified partner
                    </Badge>
                  )}
                  <Badge variant="success" className="border-0">
                    <Truck className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Free pickup
                  </Badge>
                </div>
                <h1 id="storefront-title" className="page-title">
                  {laundry.name}
                </h1>
                {sf.tagline && (
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">{sf.tagline}</p>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    {laundry.address_line}, {laundry.city}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                  <span className="rating-pill">
                    <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />
                    {rating.toFixed(1)} ({laundry.review_count})
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {deliveryLabel(meta.deliveryHours)}
                    {todayHours ? ` · Today ${todayHours}` : ''}
                  </span>
                  <span className="text-muted-foreground">
                    <ClientLocaleNumber value={orders_completed} />+ orders
                  </span>
                  <span className="font-medium text-foreground">From ₹{startPrice}</span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              className="shrink-0 rounded-xl font-bold shadow-pop"
              style={{ background: primary }}
              onClick={scrollToServices}
            >
              {heroCtaLabel}
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {/* What they serve + booking */}
        <section id="storefront-services" aria-labelledby="services-heading">
          <div className="mb-4">
            <h2 id="services-heading" className="text-xl font-bold">
              Full menu
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prices in ₹ — browse by category, then schedule pickup when you&apos;re ready.
            </p>
          </div>
          {offlineMode && (
            <OfflineBookingContactPanel
              laundryId={laundryId}
              laundryName={laundry.name}
              className="mb-6 lg:hidden"
            />
          )}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <ServiceCatalogBrowser
                laundryId={laundryId}
                quantities={quantities}
                onSelect={(svc) => setQuantity(svc, 1)}
                onIncrement={(svc) => setQuantity(svc, (quantities[svc.id] ?? 0) + 1)}
                onDecrement={(svc) => setQuantity(svc, (quantities[svc.id] ?? 0) - 1)}
                onQuantityChange={setQuantity}
                browseOnly={onlineBookingLoading || offlineMode}
              />
              {onlineMode && selectedCount > 0 && (
                <div className="mt-6 hidden lg:block">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full rounded-2xl"
                    onClick={startCheckout}
                  >
                    {accessToken ? 'Continue to checkout' : 'Sign in to checkout'}
                  </Button>
                </div>
              )}
            </div>
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
                    {selectedCount > 0 && (
                      <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        onClick={startCheckout}
                      >
                        {accessToken ? 'Schedule pickup' : 'Sign in to schedule'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* Garment price list */}
        <section id="storefront-prices" aria-labelledby="prices-heading">
          <LaundryPriceListSection
            laundryId={laundryId}
            services={services}
            headingId="prices-heading"
            onBook={scrollToServices}
            bookLabel={bookCtaLabel}
          />
        </section>

        {/* Trust — reviews */}
        <section aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="mb-4 text-xl font-bold">
            Why customers trust this store
          </h2>
          <LaundryReviewsTab
            reviews={reviewsQ.data}
            isLoading={reviewsQ.isLoading}
            avgRating={rating}
            reviewCount={laundry.review_count}
          />
        </section>

        {/* Gallery */}
        {sf.gallery.length > 0 && (
          <section aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="mb-4 text-xl font-bold">
              Gallery
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
              {sf.gallery.slice(0, 6).map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={resolveStorefrontImage(img.url)}
                    alt={img.caption ?? ''}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {(sf.brand_story || laundry.description) && (
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="mb-3 text-xl font-bold">
              About us
            </h2>
            <p className="max-w-3xl text-muted-foreground leading-relaxed">
              {sf.brand_story ?? laundry.description}
            </p>
            {(sf.owner_name || sf.years_in_business) && (
              <p className="mt-3 text-sm text-foreground">
                {sf.owner_name && <span>Led by {sf.owner_name}</span>}
                {sf.years_in_business != null && (
                  <span>
                    {sf.owner_name ? ' · ' : ''}
                    {sf.years_in_business} years in business
                  </span>
                )}
              </p>
            )}
          </section>
        )}

        {/* Facilities */}
        {sf.facilities.length > 0 && (
          <section aria-labelledby="facilities-heading">
            <h2 id="facilities-heading" className="mb-4 text-xl font-bold">
              Facilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {sf.facilities.map((f) => (
                <Badge
                  key={f}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                  style={{ borderColor: `${primary}33` }}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Highlights */}
        {sf.highlights.length > 0 && (
          <section aria-labelledby="highlights-heading">
            <h2 id="highlights-heading" className="mb-4 text-xl font-bold">
              Why choose us
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sf.highlights.map((h, i) => (
                <Card key={i} className="border-border/60 shadow-soft">
                  <CardContent className="p-5">
                    <Shield className="mb-2 h-6 w-6" style={{ color: primary }} />
                    <p className="font-semibold">{h.title}</p>
                    {h.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{h.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Machines */}
        {sf.machines.length > 0 && (
          <section aria-labelledby="machines-heading">
            <h2 id="machines-heading" className="mb-4 text-xl font-bold">
              Machines & infrastructure
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {sf.machines.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  {m.image_url && (
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={resolveStorefrontImage(m.image_url)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        {m.brand && (
                          <p className="text-xs text-muted-foreground">{m.brand}</p>
                        )}
                        {m.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {sf.team.length > 0 && (
          <section aria-labelledby="team-heading">
            <h2 id="team-heading" className="mb-4 text-xl font-bold">
              Our team
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sf.team.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex gap-4 p-4">
                    {member.photo_url && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                        <Image
                          src={resolveStorefrontImage(member.photo_url)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-primary">{member.role}</p>
                      {member.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{member.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {sf.certifications.length > 0 && (
          <section aria-labelledby="certs-heading">
            <h2 id="certs-heading" className="mb-4 text-xl font-bold">
              Certifications
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sf.certifications.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 p-4"
                >
                  <Shield className="h-8 w-8 shrink-0" style={{ color: secondary }} />
                  <div>
                    <p className="font-medium">{c.title}</p>
                    {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Videos */}
        {sf.videos.length > 0 && (
          <section aria-labelledby="videos-heading">
            <h2 id="videos-heading" className="mb-4 text-xl font-bold">
              Videos
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {sf.videos.map((v) => {
                const embed = videoEmbedUrl(v.url);
                return (
                  <div key={v.id}>
                    <p className="mb-2 font-medium">{v.title}</p>
                    {embed ? (
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                        <iframe
                          src={embed}
                          title={v.title}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <Link href={v.url} className="text-sm text-primary underline" target="_blank">
                        Watch video
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {onlineMode && (
          <StorefrontContactSection laundryId={laundryId} laundryName={laundry.name} />
        )}

        <StorefrontQuestionsSection laundryId={laundryId} />

        {/* Hours & location */}
        <section
          aria-labelledby="contact-heading"
          className="rounded-2xl border border-border/60 bg-muted/30 p-6"
        >
          <h2 id="contact-heading" className="mb-4 text-xl font-bold">
            Location & hours
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {laundry.address_line}, {laundry.city}
              </span>
            </li>
            {sf.working_hours &&
              Object.entries(sf.working_hours).map(([day, hours]) => (
                <li key={day} className="flex gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>{day}:</strong> {hours}
                  </span>
                </li>
              ))}
            {(sf.pickup_radius_km || sf.delivery_radius_km) && (
              <li className="text-muted-foreground">
                Pickup within {sf.pickup_radius_km ?? '—'} km · Delivery within{' '}
                {sf.delivery_radius_km ?? '—'} km
              </li>
            )}
          </ul>
        </section>
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
