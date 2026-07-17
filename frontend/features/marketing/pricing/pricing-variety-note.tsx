'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { PricingPageAtmosphere } from '@/features/marketing/pricing/pricing-page-atmosphere';
import { PricingRailReveal } from '@/features/marketing/pricing/pricing-rail-reveal';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

export function PricingVarietyNote() {
  const { ref, reduce, atmosphereOn } = usePricingSectionActive<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-labelledby="pricing-variety-title"
      className="pricing-page-section pricing-page-section--note border-t border-border/40 py-14 sm:py-16"
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <PricingPageAtmosphere steamEnabled={!reduce} waveEnabled />

      <div className="pricing-page-section__content mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <PricingRailReveal direction={1} distance={26}>
          <div className="pricing-page__rail-line" aria-hidden />
          <h2
            id="pricing-variety-title"
            className="mt-5 text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: 'var(--atelier-ink)' }}
          >
            Variety comes from independent laundry owners
          </h2>
          <p
            className="mt-3 text-sm leading-relaxed sm:text-base"
            style={{ color: 'var(--atelier-muted)' }}
          >
            The WashHouse connects you with verified neighbourhood partners — each sets their own
            rates. That&apos;s why you&apos;ll see different prices across stores, and why browsing
            nearby listings is the best way to find a deal.
          </p>
          <div className="mt-7">
            <Link
              href="/stores"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 w-full rounded-full border-[var(--atelier-rail)] bg-[var(--atelier-station)] text-[var(--atelier-ink)] hover:bg-[var(--atelier-peg-shine)] sm:w-auto',
              )}
            >
              Compare stores near you
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </PricingRailReveal>
      </div>
    </section>
  );
}
