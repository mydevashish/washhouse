'use client';

import { SectionHeader } from '@/components/marketplace/section-header';
import { PricingAtelierGuide } from '@/features/marketing/pricing/pricing-atelier-guide';
import { groupMarketplaceFromByCategory } from '@/features/marketing/pricing/lib/group-from-categories';
import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { MARKETING_CONTAINER } from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

type PricingPriceGuideProps = {
  items: MarketplaceFromItem[];
};

export function PricingPriceGuide({ items }: PricingPriceGuideProps) {
  const groups = groupMarketplaceFromByCategory(items);
  const { ref, reduce, atmosphereOn } = usePricingSectionActive<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-labelledby="pricing-rates-title"
      className={cn(
        'pricing-atelier pricing-atelier--from-stations',
        'border-t border-transparent pt-5 pb-12 sm:pt-6 sm:pb-16 lg:pt-7 lg:pb-20',
      )}
      data-mist={reduce ? 'off' : 'on'}
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <div className={cn('pricing-atelier__content', MARKETING_CONTAINER)}>
        <SectionHeader
          eyebrow="Starting from · indicative"
          title="Price guide by category"
          description="These are marketplace floors — the lowest published rate we see, or our platform guide when partners haven’t listed yet. Final rates are set by each laundry."
          align="center"
          className="mx-auto mb-6 max-w-[42rem] md:mb-7 md:max-w-[48rem]"
          titleId="pricing-rates-title"
        />

        <PricingAtelierGuide groups={groups} />

        <p
          className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed md:mt-10"
          style={{ color: 'var(--atelier-muted)' }}
        >
          Your bill may differ based on fabric, weight, add-ons, and the partner you choose. Always
          confirm the price on the laundry&apos;s detail page before scheduling pickup.
        </p>
      </div>
    </section>
  );
}
