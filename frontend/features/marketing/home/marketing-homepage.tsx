'use client';

import { BookingFlowSteps } from '@/components/marketplace/booking-flow-steps';
import { SectionHeader } from '@/components/marketplace/section-header';
import { TrustStrip } from '@/components/marketplace/trust-strip';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { HomeTestimonials } from '@/features/discover/homepage/home-testimonials';
import { FeaturedStoresTeaser } from '@/features/marketing/home/featured-stores-teaser';
import { FinalCtaBand } from '@/features/marketing/home/final-cta-band';
import { MarketingHomeHero } from '@/features/marketing/home/home-hero';
import { ServicesPreview } from '@/features/marketing/home/services-preview';

export function MarketingHomepage() {
  return (
    <div className="bg-background">
      <MarketingHomeHero />
      <TrustStrip />

      <section className="border-b border-border bg-card py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <FadeInItem>
              <SectionHeader
                eyebrow="How it works"
                title="Book in 4 simple steps"
                description="No confusion — pick a laundry, add services, schedule pickup, and track until delivery."
                align="center"
                className="mb-10"
              />
            </FadeInItem>
            <FadeInItem>
              <BookingFlowSteps />
            </FadeInItem>
          </FadeIn>
        </div>
      </section>

      <ServicesPreview />
      <FeaturedStoresTeaser />
      <HomeTestimonials />
      <FinalCtaBand />
    </div>
  );
}
