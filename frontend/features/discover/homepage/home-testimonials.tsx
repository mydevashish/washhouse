'use client';

import Image from 'next/image';
import { Quote, Star } from 'lucide-react';
import { useId } from 'react';

import {
  MarketingCarouselNav,
  useMarketingCarousel,
} from '@/components/marketing/carousel';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import type { MarketingTestimonial } from '@/features/marketing/testimonials/types';
import { useMarketingTestimonials } from '@/features/marketing/hooks/use-marketing';
import { GLASS_MOBILE_SOLID_CARD } from '@/features/marketing/shared/marketing-layout';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { cn } from '@/lib/utils';

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      className="mt-4 flex gap-0.5"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-3.5 w-3.5',
            index < clamped ? 'fill-rating text-rating' : 'fill-transparent text-muted-foreground/30',
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialBody({ testimonial }: { testimonial: MarketingTestimonial }) {
  return (
    <>
      <Quote className="absolute right-6 top-6 h-8 w-8 text-brand-500/10" aria-hidden />
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-brand-500/20">
          <Image
            src={testimonial.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div>
          <p className="font-bold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.location}</p>
        </div>
      </div>
      <StarRating rating={testimonial.rating} />
      <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>
    </>
  );
}

function TestimonialCard({ testimonial }: { testimonial: MarketingTestimonial }) {
  return (
    <article className="h-full">
      <GlassSurface
        variant="subtle"
        className={cn(
          'relative h-full overflow-hidden rounded-2xl p-5 sm:p-8',
          GLASS_MOBILE_SOLID_CARD,
        )}
      >
        <TestimonialBody testimonial={testimonial} />
      </GlassSurface>
    </article>
  );
}

function TestimonialsCarousel({ testimonials }: { testimonials: MarketingTestimonial[] }) {
  const carouselId = useId();
  const liveRegionId = `${carouselId}-live`;
  const { rootRef, emblaRef, selectedIndex, scrollPrev, scrollNext, scrollTo } =
    useMarketingCarousel({ loop: true, align: 'start', containScroll: 'trimSnaps' });

  const activeTestimonial = testimonials[selectedIndex] ?? testimonials[0];

  if (!activeTestimonial) return null;

  return (
    <div ref={rootRef} className="min-w-0 lg:hidden">
      <div
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
        tabIndex={0}
        className="overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="-ml-4 flex touch-pan-y">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              id={`${carouselId}-slide-${testimonial.id}`}
              className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_83.333%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${testimonials.length}`}
              aria-hidden={selectedIndex !== index}
              {...(selectedIndex !== index ? { inert: true } : {})}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      <MarketingCarouselNav
        className="mt-6"
        selectedIndex={selectedIndex}
        slideCount={testimonials.length}
        onPrev={scrollPrev}
        onNext={scrollNext}
        onSelect={scrollTo}
        getSlideControlId={(index) => `${carouselId}-slide-${testimonials[index]!.id}`}
        prevLabel="Previous review"
        nextLabel="Next review"
        dotsLabel="Choose review"
        getDotLabel={(index) => `Go to review ${index + 1}: ${testimonials[index]!.name}`}
      />

      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only">
        Review {selectedIndex + 1} of {testimonials.length}: {activeTestimonial.name}
      </div>
    </div>
  );
}

function TestimonialsGrid({ testimonials }: { testimonials: MarketingTestimonial[] }) {
  const desktopItems = testimonials.slice(0, 3);

  return (
    <ul className="hidden gap-6 lg:grid lg:grid-cols-3">
      {desktopItems.map((testimonial) => (
        <li key={testimonial.id}>
          <FadeInItem>
            <TestimonialCard testimonial={testimonial} />
          </FadeInItem>
        </li>
      ))}
    </ul>
  );
}

function TestimonialsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading customer reviews">
      <div className="grid gap-6 lg:hidden">
        <GlassSurface
          variant="subtle"
          className={cn('relative overflow-hidden rounded-2xl p-5 sm:p-8', GLASS_MOBILE_SOLID_CARD)}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-3.5 w-3.5 rounded-full" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </GlassSurface>
      </div>

      <ul className="hidden gap-6 lg:grid lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index}>
            <GlassSurface
              variant="subtle"
              className={cn('relative overflow-hidden rounded-2xl p-5 sm:p-8', GLASS_MOBILE_SOLID_CARD)}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Skeleton key={starIndex} className="h-3.5 w-3.5 rounded-full" />
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </GlassSurface>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeTestimonials() {
  const { testimonials, isLoading } = useMarketingTestimonials();

  if (isLoading) {
    return (
      <MarketingSection
        aria-labelledby="testimonials-title"
        className="bg-card"
        header={{
          title: 'What Our Customers Say',
          description: 'Real experiences from real customers',
          align: 'center',
        }}
      >
        <TestimonialsSkeleton />
      </MarketingSection>
    );
  }

  if (testimonials.length === 0) return null;

  return (
    <MarketingSection
      aria-labelledby="testimonials-title"
      className="bg-card"
      header={{
        title: 'What Our Customers Say',
        description: 'Real experiences from real customers',
        align: 'center',
      }}
    >
      <FadeIn>
        <FadeInItem>
          <TestimonialsCarousel testimonials={testimonials} />
        </FadeInItem>

        <TestimonialsGrid testimonials={testimonials} />
      </FadeIn>
    </MarketingSection>
  );
}
