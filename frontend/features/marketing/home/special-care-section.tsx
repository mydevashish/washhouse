'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import {
  SPECIAL_CARE_ITEMS,
  type SpecialCareItem,
} from '@/features/marketing/home/special-care-items';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { PricingCategoryMood } from '@/features/marketing/pricing/pricing-category-mood';
import type { PricingCategoryMoodVariant } from '@/features/marketing/pricing/pricing-category-mood-map';
import { PricingMotionBudgetProvider } from '@/features/marketing/pricing/pricing-motion-budget';
import { useAtelierProductSway } from '@/features/marketing/pricing/use-atelier-product-sway';
import { usePricingSectionActive } from '@/features/marketing/pricing/use-pricing-section-active';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

/** Map special-care tiles onto existing steam / fabric / hang moods. */
const SPECIAL_CARE_MOOD: Record<string, PricingCategoryMoodVariant> = {
  'wedding-sherwani': 'hang',
  lehengas: 'fabric',
  sarees: 'fabric',
  suits: 'hang',
  'leather-jackets': 'hang',
  shoes: 'steam',
  curtains: 'fabric',
  blankets: 'fabric',
  'soft-toys': 'fabric',
};

function SpecialCareTile({
  item,
  index,
}: {
  item: SpecialCareItem;
  index: number;
}) {
  const { slug, label, image, imageAlt } = item;
  const { ref, swayOn } = useAtelierProductSway<HTMLAnchorElement>({ amount: 0.2 });
  const mood = SPECIAL_CARE_MOOD[item.id] ?? 'fabric';
  const phaseAlt = index % 2 === 1;

  return (
    <li className="flex justify-center">
      <Link
        ref={ref}
        href={`/services#${slug}`}
        className="group flex w-full max-w-[9.5rem] flex-col items-center gap-2.5 sm:max-w-[10.5rem] md:max-w-none"
      >
        <div
          className={cn(
            'pricing-category-photo relative w-full overflow-hidden',
            'aspect-[4/3]',
          )}
        >
          <div
            className="pricing-category-photo__sway"
            data-sway={swayOn ? 'on' : 'off'}
            data-phase={phaseAlt ? 'alt' : 'main'}
            style={
              {
                '--tag-sway-amp': '0.7deg',
                animationDelay: swayOn ? `${(index % 5) * -0.55}s` : undefined,
              } as CSSProperties
            }
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 38vw, (max-width: 1024px) 22vw, 160px"
            />
          </div>
          <PricingCategoryMood variant={mood} />
        </div>

        <span className="text-center text-[0.6875rem] font-semibold leading-tight text-foreground sm:text-xs md:text-sm">
          {label}
        </span>
      </Link>
    </li>
  );
}

function SpecialCareGrid() {
  const { ref, atmosphereOn } = usePricingSectionActive<HTMLDivElement>(0.08);

  return (
    <div
      ref={ref}
      className="atelier-product-scope"
      data-atmosphere={atmosphereOn ? 'on' : 'off'}
    >
      <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:gap-x-6 md:gap-y-10 lg:gap-x-8">
        {SPECIAL_CARE_ITEMS.map((item, index) => (
          <SpecialCareTile key={item.id} item={item} index={index} />
        ))}
      </ul>
    </div>
  );
}

export function SpecialCareSection() {
  return (
    <MarketingSection
      aria-labelledby="special-care-title"
      alternate
      header={{
        title: 'Special Care For Delicate Items',
        description: 'Expert handling for garments and home textiles that need extra attention.',
        align: 'center',
      }}
    >
      <PricingMotionBudgetProvider>
        <SpecialCareGrid />
      </PricingMotionBudgetProvider>
    </MarketingSection>
  );
}
