'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { HERO_IMAGE, HERO_SLIDE_IMAGES } from '@/features/discover/marketplace/laundry-images';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 5000;

type SlideStat = {
  label: string;
  value: string;
  valueClassName?: string;
};

type HeroSlide = {
  id: string;
  headline: string;
  subcopy: string;
  image: string;
  imageAlt: string;
  overlayClassName: string;
  cta: { label: string; href: string };
  stats?: SlideStat[];
  showBrand?: boolean;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'zero-trips',
    headline: 'Fresh clothes. Zero trips.',
    subcopy:
      'The WashHouse connects you with trusted laundries near you — free doorstep pickup, live tracking, and delivery back home.',
    image: HERO_IMAGE,
    imageAlt: 'Neatly folded fresh laundry prepared for home delivery',
    overlayClassName:
      'bg-gradient-to-br from-brand-500/75 via-brand-600/55 to-sky-500/45 dark:from-brand-900/80 dark:via-brand-600/50 dark:to-sky-500/35',
    cta: { label: 'Book pickup', href: '/discover#laundries' },
    showBrand: true,
    stats: [
      { label: 'Avg. turnaround', value: '24 hours', valueClassName: 'text-primary' },
      { label: 'Starting from', value: '₹69/kg', valueClassName: 'text-success' },
    ],
  },
  {
    id: 'doorstep',
    headline: 'Free doorstep pickup & delivery',
    subcopy:
      'Schedule a pickup from home or office. We collect, clean, and deliver — no laundromat runs, no waiting in line.',
    imageAlt: 'Laundry bags ready for doorstep pickup',
    overlayClassName:
      'bg-gradient-to-tr from-sky-500/70 via-brand-500/50 to-brand-900/55 dark:from-sky-500/40 dark:via-brand-600/45 dark:to-brand-900/70',
    cta: { label: 'Discover stores', href: '/discover#laundries' },
    image: HERO_SLIDE_IMAGES.doorstep,
  },
  {
    id: 'compare',
    headline: 'Compare trusted laundries near you',
    subcopy:
      'Ratings, turnaround times, and transparent pricing — pick the store that fits your schedule and budget.',
    image: HERO_SLIDE_IMAGES.compare,
    imageAlt: 'Clean laundry facility with modern equipment',
    overlayClassName:
      'bg-gradient-to-bl from-brand-500/65 via-sky-500/45 to-brand-900/60 dark:from-brand-600/50 dark:via-sky-500/35 dark:to-brand-900/75',
    cta: { label: 'View services', href: '/services' },
  },
  {
    id: 'partner',
    headline: 'Grow your laundry business with WashHouse',
    subcopy:
      'List your store, reach new customers, and manage orders from one dashboard. Franchise and partner programs available.',
    image: HERO_SLIDE_IMAGES.partner,
    imageAlt: 'Laundry business owner reviewing orders on a tablet',
    overlayClassName:
      'bg-gradient-to-r from-brand-900/70 via-brand-500/55 to-sky-500/50 dark:from-brand-900/85 dark:via-brand-600/50 dark:to-sky-500/40',
    cta: { label: 'Become a partner', href: '/franchise' },
  },
];

export function HeroCarousel() {
  const reduceMotion = usePrefersReducedMotion();
  const carouselId = useId();
  const liveRegionId = `${carouselId}-live`;
  const pausedRef = useRef(false);
  const carouselRootRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const pauseAutoplay = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumeAutoplay = useCallback(() => {
    if (!reduceMotion) {
      pausedRef.current = false;
    }
  }, [reduceMotion]);

  const scrollPrev = useCallback(() => {
    pauseAutoplay();
    emblaApi?.scrollPrev();
  }, [emblaApi, pauseAutoplay]);

  const scrollNext = useCallback(() => {
    pauseAutoplay();
    emblaApi?.scrollNext();
  }, [emblaApi, pauseAutoplay]);

  const scrollTo = useCallback(
    (index: number) => {
      pauseAutoplay();
      emblaApi?.scrollTo(index);
    },
    [emblaApi, pauseAutoplay],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const next = emblaApi.selectedScrollSnap();
    setSelectedIndex((prev) => {
      if (next !== prev) setHasNavigated(true);
      return next;
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const root = carouselRootRef.current;
      if (!root?.contains(document.activeElement)) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollNext, scrollPrev],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeSlide = HERO_SLIDES[selectedIndex] ?? HERO_SLIDES[0]!;

  return (
    <div
      ref={carouselRootRef}
      className="relative"
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
        className="group/hero overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:rounded-3xl"
      >
        <div className="flex touch-pan-y">
            {HERO_SLIDES.map((slide, index) => {
              const nextIndex = (selectedIndex + 1) % HERO_SLIDES.length;
              const prevIndex =
                (selectedIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
              const shouldLoadImage =
                index === selectedIndex ||
                index === nextIndex ||
                (hasNavigated && index === prevIndex);

              return (
              <div
                key={slide.id}
                id={`${carouselId}-slide-${slide.id}`}
                className="relative min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${HERO_SLIDES.length}`}
                aria-hidden={selectedIndex !== index}
                {...(selectedIndex !== index ? { inert: true } : {})}
              >
                <div className="relative aspect-[4/5] min-h-[22rem] pb-16 sm:aspect-[16/10] sm:min-h-[26rem] sm:pb-0 lg:aspect-[21/9] lg:min-h-[28rem]">
                  {shouldLoadImage ? (
                  <Image
                    src={slide.image}
                    alt={slide.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                  />
                  ) : (
                    <div className="absolute inset-0 bg-muted" aria-hidden />
                  )}
                  <div
                    className={cn('absolute inset-0', slide.overlayClassName)}
                    aria-hidden
                  />

                  <div className="absolute inset-0 flex items-end p-4 sm:items-center sm:p-6 lg:p-10">
                    <GlassSurface
                      variant="strong"
                      className={cn(
                        'w-full max-w-xl rounded-2xl p-5 shadow-pop transition-[opacity,transform] duration-slow ease-out sm:p-6 lg:max-w-2xl lg:p-8',
                        selectedIndex === index
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-2 opacity-0',
                      )}
                    >
                      {slide.showBrand ? (
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
                      ) : null}

                      <h2
                        id={index === selectedIndex ? 'marketing-hero-title' : undefined}
                        className="text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
                      >
                        {slide.headline}
                      </h2>
                      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {slide.subcopy}
                      </p>

                      {slide.stats?.length ? (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5">
                          {slide.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 backdrop-blur-sm"
                            >
                              <p className="text-xs font-medium text-muted-foreground">
                                {stat.label}
                              </p>
                              <p
                                className={cn(
                                  'text-base font-bold sm:text-lg',
                                  stat.valueClassName,
                                )}
                              >
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 hidden sm:block">
                        <Button
                          asChild
                          size="lg"
                          className="h-11 rounded-full px-6 active:scale-[0.98]"
                        >
                          <Link href={slide.cta.href}>
                            {slide.cta.label}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    </GlassSurface>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute left-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border-border/80 bg-background/90 shadow-soft backdrop-blur-sm transition-[opacity,transform] duration-base ease-out hover:bg-background active:scale-[0.98] sm:left-4 lg:left-6"
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border-border/80 bg-background/90 shadow-soft backdrop-blur-sm transition-[opacity,transform] duration-base ease-out hover:bg-background active:scale-[0.98] sm:right-4 lg:right-6"
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Button>

      <div
        className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2 sm:bottom-6"
        role="tablist"
        aria-label="Choose slide"
      >
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={selectedIndex === index}
            aria-controls={`${carouselId}-slide-${slide.id}`}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-full transition-[opacity,transform] duration-base ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}: ${slide.headline}`}
          >
            <span
              aria-hidden
              className={cn(
                'block rounded-full transition-[width,background-color] duration-base ease-out',
                selectedIndex === index
                  ? 'h-2.5 w-8 bg-brand-500'
                  : 'h-2.5 w-2.5 bg-muted-foreground/35 group-hover:bg-muted-foreground/55',
              )}
            />
          </button>
        ))}
      </div>

      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {selectedIndex + 1} of {HERO_SLIDES.length}: {activeSlide.headline}
      </div>
    </div>
  );
}
