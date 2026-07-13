'use client';

import Image from 'next/image';
import { Quote, Star } from 'lucide-react';
import { useId } from 'react';

import {
  MarketingCarouselNav,
  useMarketingCarousel,
} from '@/components/marketing/carousel';
import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { GlassSurface } from '@/components/ui/glass-surface';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { cn } from '@/lib/utils';

const TESTIMONIALS = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    location: 'Koramangala',
    rating: 5,
    text: 'I pick a laundry on DLM, choose wash & fold, and they handle the rest. Pickup was on time every week.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'rahul-menon',
    name: 'Rahul Menon',
    location: 'Indiranagar',
    rating: 5,
    text: 'Love that I compare stores first. Found a partner with great ratings and transparent pricing.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'ananya-iyer',
    name: 'Ananya Iyer',
    location: 'HSR Layout',
    rating: 5,
    text: 'Free pickup and delivery sold me. The app makes it easy to track when clothes are on the way back.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  },
] as const;

type Testimonial = (typeof TESTIMONIALS)[number];

function TestimonialBody({ testimonial }: { testimonial: Testimonial }) {
  return (
    <>
      <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" aria-hidden />
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/20">
          <Image src={testimonial.image} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div>
          <p className="font-bold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.location}</p>
        </div>
      </div>
      <div
        className="mt-4 flex gap-0.5"
        role="img"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />
        ))}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>
    </>
  );
}

function TestimonialCard({
  testimonial,
  variant,
}: {
  testimonial: Testimonial;
  variant: 'grid' | 'carousel';
}) {
  const sharedClassName =
    'relative h-full overflow-hidden rounded-2xl border-0 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-[var(--shadow-card-hover)]';

  if (variant === 'carousel') {
    return (
      <GlassSurface variant="subtle" className={cn(sharedClassName, 'p-6 sm:p-8')}>
        <TestimonialBody testimonial={testimonial} />
      </GlassSurface>
    );
  }

  return (
    <Card className={sharedClassName}>
      <CardContent className="p-6 sm:p-8">
        <TestimonialBody testimonial={testimonial} />
      </CardContent>
    </Card>
  );
}

function TestimonialsCarousel() {
  const carouselId = useId();
  const liveRegionId = `${carouselId}-live`;
  const { rootRef, emblaRef, selectedIndex, scrollPrev, scrollNext, scrollTo } =
    useMarketingCarousel({ loop: true, align: 'start', containScroll: 'trimSnaps' });

  const activeTestimonial = TESTIMONIALS[selectedIndex] ?? TESTIMONIALS[0]!;

  return (
    <div ref={rootRef} className="lg:hidden">
      <div
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
        tabIndex={0}
        className="overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="-ml-4 flex touch-pan-y">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.id}
              id={`${carouselId}-slide-${testimonial.id}`}
              className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_83.333%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${TESTIMONIALS.length}`}
              aria-hidden={selectedIndex !== index}
              {...(selectedIndex !== index ? { inert: true } : {})}
            >
              <TestimonialCard testimonial={testimonial} variant="carousel" />
            </div>
          ))}
        </div>
      </div>

      <MarketingCarouselNav
        className="mt-6"
        selectedIndex={selectedIndex}
        slideCount={TESTIMONIALS.length}
        onPrev={scrollPrev}
        onNext={scrollNext}
        onSelect={scrollTo}
        getSlideControlId={(index) => `${carouselId}-slide-${TESTIMONIALS[index]!.id}`}
        prevLabel="Previous review"
        nextLabel="Next review"
        dotsLabel="Choose review"
        getDotLabel={(index) =>
          `Go to review ${index + 1}: ${TESTIMONIALS[index]!.name}`
        }
      />

      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only">
        Review {selectedIndex + 1} of {TESTIMONIALS.length}: {activeTestimonial.name}
      </div>
    </div>
  );
}

function TestimonialsGrid() {
  return (
    <ul className="hidden gap-6 md:grid-cols-3 lg:grid">
      {TESTIMONIALS.map((testimonial) => (
        <li key={testimonial.id}>
          <FadeInItem>
            <TestimonialCard testimonial={testimonial} variant="grid" />
          </FadeInItem>
        </li>
      ))}
    </ul>
  );
}

export function HomeTestimonials() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="bg-card py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <SectionHeader
              eyebrow="Reviews"
              title="Loved by customers"
              description="Real stories from people who book professional laundry through DLM."
              align="center"
              className="mb-10"
            />
          </FadeInItem>

          <FadeInItem>
            <TestimonialsCarousel />
          </FadeInItem>

          <TestimonialsGrid />
        </FadeIn>
      </div>
    </section>
  );
}
