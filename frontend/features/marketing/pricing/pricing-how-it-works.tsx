'use client';

import { BadgeIndianRupee, Shirt, Tag, Truck } from 'lucide-react';

import {
  PRICING_STATIONS,
  type PricingStationId,
} from '@/features/marketing/pricing/pricing-data';
import { PricingPageAtmosphere } from '@/features/marketing/pricing/pricing-page-atmosphere';
import { PricingRailReveal } from '@/features/marketing/pricing/pricing-rail-reveal';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

const STATION_ICONS: Record<PricingStationId, typeof Truck> = {
  pickup: Truck,
  wash: Shirt,
  tag: Tag,
  pay: BadgeIndianRupee,
};

export function PricingHowItWorks() {
  const { ref, reduce, atmosphereOn } = usePricingSectionActive<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-labelledby="pricing-how-title"
      className="pricing-page-section pricing-page-section--stations border-t border-border/30 pt-8 pb-0 sm:pt-10 lg:pt-12"
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <PricingPageAtmosphere steamEnabled={!reduce} waveEnabled />

      <div className="pricing-page-section__content mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <PricingRailReveal direction={-1} distance={20} className="mx-auto max-w-2xl text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--atelier-price)' }}
          >
            How pricing works
          </p>
          <div className="pricing-page__rail-line mt-2" aria-hidden />
          <h2
            id="pricing-how-title"
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: 'var(--atelier-ink)' }}
          >
            From pickup to pay — along one rail
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed sm:text-base"
            style={{ color: 'var(--atelier-muted)' }}
          >
            No hidden platform fees, and no city-wide fixed prices — follow the stations as you
            book through The WashHouse.
          </p>
        </PricingRailReveal>

        <div className="pricing-stations mt-6 sm:mt-7">
          <div className="pricing-stations__rail pricing-stations__rail--vertical" aria-hidden />
          <div className="pricing-stations__rail pricing-stations__rail--horizontal" aria-hidden />

          <ol className="pricing-stations__list" aria-label="Pricing journey stations">
            {PRICING_STATIONS.map(({ id, station, title, description }, index) => {
              const Icon = STATION_ICONS[id];
              const direction: 1 | -1 = index % 2 === 0 ? 1 : -1;

              return (
                <li key={id} className="pricing-station">
                  <PricingRailReveal
                    direction={direction}
                    distance={28}
                    className={cn(
                      'flex w-full gap-4',
                      'md:flex-col md:items-center md:gap-2.5 md:text-center',
                    )}
                  >
                    <span className="pricing-station__peg">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="pricing-station__body">
                      <p className="pricing-station__label">
                        Station {index + 1} · {station}
                      </p>
                      <h3 className="pricing-station__title">{title}</h3>
                      <p className="pricing-station__desc">{description}</p>
                    </div>
                  </PricingRailReveal>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Continuity cue into the peg-rail price guide */}
        <div className="pricing-stations__handoff" aria-hidden>
          <div className="pricing-stations__handoff-rail" />
          <div className="pricing-stations__handoff-drop" />
        </div>
      </div>
    </section>
  );
}
