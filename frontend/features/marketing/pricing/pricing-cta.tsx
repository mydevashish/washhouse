'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { PricingPageAtmosphere } from '@/features/marketing/pricing/pricing-page-atmosphere';
import { PricingRailInView } from '@/features/marketing/pricing/pricing-rail-reveal';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

export function PricingCta() {
  const { ref, reduce, atmosphereOn } = usePricingSectionActive<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-labelledby="pricing-cta-title"
      className="pricing-page-section pricing-page-section--cta border-t border-border/30 py-14 sm:py-16 lg:py-20"
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <PricingPageAtmosphere steamEnabled={!reduce} waveEnabled ctaWave />

      <div className="pricing-page-section__content mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <PricingRailInView direction={-1} distance={22}>
          <div className="pricing-page__rail-line" aria-hidden />
          <h2
            id="pricing-cta-title"
            className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: 'var(--atelier-on-cta)' }}
          >
            See prices near you
          </h2>
          <p
            className="mt-3 text-base leading-relaxed sm:text-lg"
            style={{ color: 'var(--atelier-on-cta-muted)' }}
          >
            Browse verified laundries, compare their rates, and book pickup when you&apos;re ready.
          </p>
          <div className="mt-8">
            <Link
              href="/stores"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 w-full rounded-full bg-[var(--atelier-on-cta)] text-[var(--atelier-cta-top)] hover:bg-[var(--atelier-on-cta)]/95 sm:w-auto',
              )}
            >
              See prices near you
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </PricingRailInView>
      </div>
    </section>
  );
}
