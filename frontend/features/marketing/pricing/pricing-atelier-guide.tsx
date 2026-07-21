'use client';

import { useReducedMotion } from 'framer-motion';

import type { PricingFromGroup } from '@/features/marketing/pricing/lib/group-from-categories';
import { PricingAtelierAtmosphere } from '@/features/marketing/pricing/pricing-atelier-atmosphere';
import { PricingCategoryAmbient } from '@/features/marketing/pricing/pricing-category-ambient';
import { PricingCategoryPhoto } from '@/features/marketing/pricing/pricing-category-photo';
import { PricingCategoryRack } from '@/features/marketing/pricing/pricing-category-rack';
import { PricingCategoryTable } from '@/features/marketing/pricing/pricing-category-table';
import { PricingMotionBudgetProvider } from '@/features/marketing/pricing/pricing-motion-budget';

import '@/features/marketing/pricing/pricing-atelier.css';

type PricingAtelierGuideProps = {
  groups: PricingFromGroup[];
};

/**
 * Motion atelier (hanging tags) or static category tables when
 * `prefers-reduced-motion: reduce`. Mist + ambient depth are gated by the
 * parent `.pricing-atelier[data-atmosphere]` flag.
 */
export function PricingAtelierGuide({ groups }: PricingAtelierGuideProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="pricing-atelier-guide pricing-atelier-guide--static">
        {groups.map((group, index) => {
          const photoFirst = index % 2 === 0;
          return (
            <div
              key={group.category}
              className="pricing-atelier-guide__unit pricing-category-rack__unit"
            >
              <PricingCategoryAmbient
                category={group.category}
                anchor={photoFirst ? 'start' : 'end'}
              />
              <PricingCategoryPhoto
                category={group.category}
                priority={index === 0}
                mood={false}
                sway={false}
                className={photoFirst ? 'relative z-[1]' : 'relative z-[1] lg:order-2'}
              />
              <PricingCategoryTable
                group={group}
                className={
                  photoFirst ? 'relative z-[1]' : 'relative z-[1] lg:order-1'
                }
              />
              <div
                className="pricing-category-rack__conveyor relative z-[1] lg:order-3"
                aria-hidden
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <PricingMotionBudgetProvider>
      <PricingAtelierAtmosphere mistEnabled />
      <div className="pricing-atelier-guide relative z-[1]">
        {groups.map((group, index) => (
          <PricingCategoryRack
            key={group.category}
            group={group}
            index={index}
            conveyorDirection={index % 2 === 0 ? 1 : -1}
          />
        ))}
      </div>
    </PricingMotionBudgetProvider>
  );
}
