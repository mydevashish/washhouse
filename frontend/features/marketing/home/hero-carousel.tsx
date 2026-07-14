'use client';

import {
  ArrowRight,
  Check,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import {
  MarketingCarouselNav,
  useMarketingCarousel,
} from '@/components/marketing/carousel';
import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import {
  HERO_SLIDES,
  WHATSAPP_BOOKING_MESSAGE,
  type HeroSlide,
} from '@/features/marketing/home/hero-slides';
import {
  GLASS_MOBILE_SOLID_CARD,
  MARKETING_HERO_GRID,
  MARKETING_HERO_HEADLINE,
  MARKETING_HERO_IMAGE_COL,
  MARKETING_HERO_IMAGE_FRAME,
  MARKETING_HERO_TEXT_COL,
} from '@/features/marketing/shared/marketing-layout';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 5000;

const whatsappHref = buildWhatsAppHref(
  CONTACT_CONFIG.whatsapp,
  WHATSAPP_BOOKING_MESSAGE,
);
const telHref = buildTelHref(CONTACT_CONFIG.phone);

function HeroSlideImage({
  slide,
  index,
  selectedIndex,
  hasNavigated,
}: {
  slide: HeroSlide;
  index: number;
  selectedIndex: number;
  hasNavigated: boolean;
}) {
  const nextIndex = (selectedIndex + 1) % HERO_SLIDES.length;
  const prevIndex = (selectedIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  const shouldLoad =
    index === selectedIndex ||
    index === nextIndex ||
    (hasNavigated && index === prevIndex);

  return (
    <div className={MARKETING_HERO_IMAGE_FRAME}>
      {shouldLoad ? (
        <Image
          src={slide.image}
          alt={slide.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1023px) calc(100vw - 2rem), (max-width: 1280px) 50vw, 720px"
          priority={index === 0}
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'low'}
        />
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden />
      )}
      <div className={cn('absolute inset-0', slide.overlayClassName)} aria-hidden />

      {slide.variant === 'welcome' ? (
        <GlassSurface
          variant="strong"
          className={cn(
            'absolute bottom-4 right-4 z-10 hidden max-w-[11rem] rounded-xl p-3 shadow-pop sm:block lg:bottom-8 lg:right-8 lg:max-w-[12rem] lg:p-4',
            GLASS_MOBILE_SOLID_CARD,
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-success sm:text-sm">
            {slide.promo.badge}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-foreground sm:text-base">
            {slide.promo.code}
          </p>
          <p className="mt-1 text-xs leading-snug text-foreground/80">
            Use at checkout on your first order
          </p>
        </GlassSurface>
      ) : null}

      {slide.variant === 'delivery' && slide.phoneImage ? (
        <div className="absolute bottom-6 right-6 z-10 hidden w-[28%] max-w-[9rem] overflow-hidden rounded-2xl border-4 border-background/80 shadow-pop lg:block xl:max-w-[10.5rem]">
          <div className="relative aspect-[9/19]">
            <Image
              src={slide.phoneImage}
              alt={slide.phoneImageAlt ?? 'Order tracking on mobile'}
              fill
              className="object-cover"
              sizes="160px"
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WelcomeSlideContent({
  slide,
  isActive,
}: {
  slide: Extract<HeroSlide, { variant: 'welcome' }>;
  isActive: boolean;
}) {
  return (
    <>
      <div className="mb-3 flex flex-col gap-3 sm:mb-4">
        <WashhouseLogo
          adaptive={false}
          href="/"
          priority
          className="h-9 w-auto sm:h-10"
        />
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
          India&apos;s laundry marketplace
        </p>
      </div>

      <h2
        className={MARKETING_HERO_HEADLINE}
        {...(isActive ? { id: 'marketing-hero-title' } : {})}
      >
        {slide.headline}
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
        {slide.pills.map((pill, pillIndex) => (
          <span key={pill} className="inline-flex items-center gap-2">
            {pillIndex > 0 ? (
              <span className="text-foreground/40" aria-hidden>
                |
              </span>
            ) : null}
            {pill}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-2 sm:hidden">
        {slide.trustItems.map(({ label }) => (
          <li key={label} className="flex items-center gap-2 text-sm text-foreground/80">
            <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <ul className="mt-5 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {slide.trustItems.map(({ label, icon: Icon }) => (
          <li key={label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-medium leading-snug text-foreground/80">
              {label}
            </span>
          </li>
        ))}
      </ul>

      <GlassSurface
        variant="strong"
        className={cn('mt-4 rounded-xl p-3 shadow-pop sm:hidden', GLASS_MOBILE_SOLID_CARD)}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-success">
          {slide.promo.badge}
        </p>
        <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
          {slide.promo.code}
        </p>
      </GlassSurface>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          variant="success"
          className="h-11 rounded-full px-6 active:scale-[0.98]"
          data-marketing-sticky-cta
        >
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Book on WhatsApp
          </a>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-11 rounded-full border-border/80 bg-background/95 px-6 shadow-soft backdrop-blur-sm active:scale-[0.98]"
        >
          <a href={telHref}>
            <Phone className="h-4 w-4" aria-hidden />
            Call {CONTACT_CONFIG.phone}
          </a>
        </Button>
      </div>
    </>
  );
}

function ServicesSlideContent({
  slide,
  isActive,
}: {
  slide: Extract<HeroSlide, { variant: 'services' }>;
  isActive: boolean;
}) {
  return (
    <>
      <h2
        className={MARKETING_HERO_HEADLINE}
        {...(isActive ? { id: 'marketing-hero-title' } : {})}
      >
        {slide.headline}
      </h2>
      {slide.subcopy ? (
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/80 sm:text-base">
          {slide.subcopy}
        </p>
      ) : null}
      <p className="mt-4 text-sm font-semibold text-foreground sm:text-base">
        {slide.services.join(' | ')}
      </p>
      <div className="mt-5">
        <Button
          asChild
          size="lg"
          className="h-11 rounded-full px-6 active:scale-[0.98]"
        >
          <Link href="/services">
            View all services
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}

function FranchiseSlideContent({
  slide,
  isActive,
}: {
  slide: Extract<HeroSlide, { variant: 'franchise' }>;
  isActive: boolean;
}) {
  return (
    <>
      <h2
        className={MARKETING_HERO_HEADLINE}
        {...(isActive ? { id: 'marketing-hero-title' } : {})}
      >
        {slide.headline}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/80 sm:text-base">
        {slide.subcopy}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {slide.benefits.map(({ label, icon: Icon }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 max-md:[backdrop-filter:none] md:bg-background/50 md:backdrop-blur-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
              {label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          className="h-11 rounded-full px-6 active:scale-[0.98]"
        >
          <Link href={slide.applyHref}>
            Apply now
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-11 rounded-full border-border/80 bg-background/95 px-6 shadow-soft backdrop-blur-sm active:scale-[0.98]"
        >
          <Link href={slide.brochureHref}>
            <Mail className="h-4 w-4" aria-hidden />
            Request brochure
          </Link>
        </Button>
      </div>
    </>
  );
}

function DeliverySlideContent({
  slide,
  isActive,
}: {
  slide: Extract<HeroSlide, { variant: 'delivery' }>;
  isActive: boolean;
}) {
  return (
    <>
      <h2
        className={MARKETING_HERO_HEADLINE}
        {...(isActive ? { id: 'marketing-hero-title' } : {})}
      >
        {slide.headline}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/80 sm:text-base">
        {slide.subcopy}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          variant="success"
          className="h-11 rounded-full px-6 active:scale-[0.98]"
        >
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Book on WhatsApp
          </a>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-11 rounded-full border-border/80 bg-background/95 px-6 shadow-soft backdrop-blur-sm active:scale-[0.98]"
        >
          <Link href="/discover#laundries">
            Find a store
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}

function HeroSlideContent({
  slide,
  isActive,
}: {
  slide: HeroSlide;
  isActive: boolean;
}) {
  switch (slide.variant) {
    case 'welcome':
      return <WelcomeSlideContent slide={slide} isActive={isActive} />;
    case 'services':
      return <ServicesSlideContent slide={slide} isActive={isActive} />;
    case 'franchise':
      return <FranchiseSlideContent slide={slide} isActive={isActive} />;
    case 'delivery':
      return <DeliverySlideContent slide={slide} isActive={isActive} />;
  }
}

export function HeroCarousel() {
  const reduceMotion = usePrefersReducedMotion();
  const carouselId = useId();
  const liveRegionId = `${carouselId}-live`;
  const pausedRef = useRef(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const {
    rootRef,
    emblaRef,
    emblaApi,
    selectedIndex,
    scrollPrev,
    scrollNext,
    scrollTo,
  } = useMarketingCarousel({ loop: true, align: 'start' });

  const pauseAutoplay = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumeAutoplay = useCallback(() => {
    if (!reduceMotion) {
      pausedRef.current = false;
    }
  }, [reduceMotion]);

  const handleScrollPrev = useCallback(() => {
    pauseAutoplay();
    setHasNavigated(true);
    scrollPrev();
  }, [pauseAutoplay, scrollPrev]);

  const handleScrollNext = useCallback(() => {
    pauseAutoplay();
    setHasNavigated(true);
    scrollNext();
  }, [pauseAutoplay, scrollNext]);

  const handleScrollTo = useCallback(
    (index: number) => {
      pauseAutoplay();
      setHasNavigated(true);
      scrollTo(index);
    },
    [pauseAutoplay, scrollTo],
  );

  useEffect(() => {
    if (!emblaApi || reduceMotion) return;

    const interval = window.setInterval(() => {
      if (!pausedRef.current) {
        emblaApi.scrollNext();
      }
    }, AUTOPLAY_MS);

    emblaApi.on('pointerDown', pauseAutoplay);

    return () => {
      window.clearInterval(interval);
      emblaApi.off('pointerDown', pauseAutoplay);
    };
  }, [emblaApi, pauseAutoplay, reduceMotion]);

  useEffect(() => {
    if (!emblaApi) return;

    const reInit = () => {
      emblaApi.reInit();
    };

    reInit();
    window.addEventListener('resize', reInit);
    return () => window.removeEventListener('resize', reInit);
  }, [emblaApi]);

  const activeSlide = HERO_SLIDES[selectedIndex] ?? HERO_SLIDES[0]!;

  return (
    <div
      ref={rootRef}
      className="relative w-full min-w-0"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onFocusCapture={pauseAutoplay}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resumeAutoplay();
        }
      }}
    >
      <div
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotional highlights"
        tabIndex={0}
        className="w-full min-w-0 overflow-hidden rounded-2xl bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:rounded-3xl"
      >
        <div className="flex w-full touch-pan-x">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = selectedIndex === index;

            return (
              <div
                key={slide.id}
                id={`${carouselId}-slide-${slide.id}`}
                className={cn(
                  'relative w-full min-w-0 shrink-0 grow-0 basis-full',
                  !isActive && 'pointer-events-none',
                )}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${HERO_SLIDES.length}`}
                aria-hidden={!isActive}
              >
                <div className={MARKETING_HERO_GRID}>
                  <div className={MARKETING_HERO_TEXT_COL}>
                    <HeroSlideContent slide={slide} isActive={isActive} />
                  </div>

                  <div className={MARKETING_HERO_IMAGE_COL}>
                    <HeroSlideImage
                      slide={slide}
                      index={index}
                      selectedIndex={selectedIndex}
                      hasNavigated={hasNavigated}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MarketingCarouselNav
        className="pointer-events-auto absolute inset-x-0 bottom-3 z-20 flex justify-center px-4 sm:bottom-4 lg:inset-x-6 lg:left-1/2 lg:justify-end"
        selectedIndex={selectedIndex}
        slideCount={HERO_SLIDES.length}
        onPrev={handleScrollPrev}
        onNext={handleScrollNext}
        onSelect={handleScrollTo}
        getSlideControlId={(index) => `${carouselId}-slide-${HERO_SLIDES[index]!.id}`}
        getDotLabel={(index) =>
          `Go to slide ${index + 1}: ${HERO_SLIDES[index]!.headline}`
        }
      />

      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {selectedIndex + 1} of {HERO_SLIDES.length}: {activeSlide.headline}
      </div>
    </div>
  );
}
