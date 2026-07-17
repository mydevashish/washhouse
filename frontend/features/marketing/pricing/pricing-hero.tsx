'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { WashhouseLogo, WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { buttonVariants } from '@/components/ui/button';
import { PricingPageAtmosphere } from '@/features/marketing/pricing/pricing-page-atmosphere';
import { PricingRailInView } from '@/features/marketing/pricing/pricing-rail-reveal';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

export function PricingHero() {
  const { ref, reduce, atmosphereOn } = usePricingSectionActive<HTMLElement>();

  return (
    <header
      ref={ref}
      className="pricing-page-section pricing-page-section--hero border-b border-border/40"
      aria-labelledby="pricing-hero-title"
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <PricingPageAtmosphere steamEnabled={!reduce} waveEnabled midWave />

      <div className="pricing-page-section__content pricing-hero__content mx-auto w-full max-w-3xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 lg:pb-12 lg:pt-9">
        <PricingRailInView direction={-1} distance={20}>
          {/* Fixed aspect box avoids CLS while the priority logo paints */}
          <span
            className="pricing-hero__mark inline-flex h-[4.25rem] w-auto max-w-full sm:h-[5.25rem] lg:h-[6.25rem]"
            style={{ aspectRatio: '962 / 683' }}
          >
            <WashhouseLogo
              adaptive={false}
              href="/"
              priority
              className="h-full w-auto max-h-full"
            />
          </span>
          <span className="sr-only">{WASHHOUSE_BRAND_NAME}</span>
        </PricingRailInView>

        <PricingRailInView direction={1} distance={24} delay={0.06} className="mt-4 sm:mt-5">
          <div className="pricing-page__rail-line pricing-hero__rail" aria-hidden />
          <h1
            id="pricing-hero-title"
            className="pricing-hero__title mt-3 sm:mt-3.5 text-balance"
            style={{ color: 'var(--atelier-ink)' }}
          >
            Transparent pricing. Same rates at every store.
          </h1>
          <p
            className="pricing-hero__support mt-2.5 max-w-xl"
            style={{ color: 'var(--atelier-muted)' }}
          >
            Starting-from rates below are indicative by category — find a nearby store when
            you&apos;re ready to book.
          </p>
          <div className="mt-5 sm:mt-6">
            <Link
              href="/stores"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 w-full rounded-full shadow-pop sm:w-auto',
              )}
            >
              Browse stores
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </PricingRailInView>
      </div>
    </header>
  );
}
