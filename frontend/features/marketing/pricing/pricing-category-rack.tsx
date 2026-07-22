'use client';

import { useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

import { PRICE_LIST_CATEGORY_LABELS } from '@/features/laundry-price-list/types';
import type { PricingFromGroup } from '@/features/marketing/pricing/lib/group-from-categories';
import { getPricingTagLines } from '@/features/marketing/pricing/lib/tag-price-lines';
import { PricingCategoryAmbient } from '@/features/marketing/pricing/pricing-category-ambient';
import { PricingCategoryPhoto } from '@/features/marketing/pricing/pricing-category-photo';
import { PricingPegRail } from '@/features/marketing/pricing/pricing-peg-rail';
import { resolvePricingProductImage } from '@/features/marketing/pricing/pricing-product-images';
import { PricingPriceTag } from '@/features/marketing/pricing/pricing-price-tag';
import { PricingRailReveal } from '@/features/marketing/pricing/pricing-rail-reveal';
import { useActiveRackItem } from '@/features/marketing/pricing/use-active-rack-item';
import { usePrefetchRackPhotos } from '@/features/marketing/pricing/use-prefetch-rack-photos';
import { cn } from '@/lib/utils';

type PricingCategoryRackProps = {
  group: PricingFromGroup;
  /** Alternating conveyor direction when sliding onto the next rod. */
  conveyorDirection?: 1 | -1;
  /** Even index → photo left; odd → photo right (desktop rhythm). */
  index?: number;
  className?: string;
};

/** Full-bleed rate card: editorial photo + peg rail with hanging tags. */
export function PricingCategoryRack({
  group,
  conveyorDirection = 1,
  index = 0,
  className,
}: PricingCategoryRackProps) {
  const headingId = `pricing-rack-${group.category}`;
  const label = PRICE_LIST_CATEGORY_LABELS[group.category];
  const scrollerLabel = `${label} starting-from prices — tab through tags or scroll horizontally`;
  const photoFirst = index % 2 === 0;
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.06, margin: '12% 0px' });
  const { activeIndex, photoIndex, isScrolling } = useActiveRackItem({
    scrollerRef,
    itemCount: group.items.length,
  });
  console.log({
  activeIndex,
  photoIndex,
  total: group.items.length,
});
  const spotlightItem = group.items[activeIndex] ?? group.items[0];
  const photoItem = group.items[photoIndex] ?? spotlightItem ?? group.items[0];
  const activeImage = photoItem
    ? resolvePricingProductImage(
        photoItem.slug,
        photoItem.name,
        group.category,
      )
    : undefined;

  usePrefetchRackPhotos({
    items: group.items,
    category: group.category,
    activeIndex,
    enabled: Boolean(!reduce && inView),
  });

  return (
    <PricingRailReveal
      direction={conveyorDirection}
      distance={48}
      className={cn('pricing-category-rack', className)}
    >
      <section
        ref={sectionRef}
        aria-labelledby={headingId}
        className="pricing-category-rack__unit"
      >
        <PricingCategoryAmbient
          category={group.category}
          anchor={photoFirst ? 'start' : 'end'}
        />

        <div
          className={cn(
            'pricing-category-rack__body relative z-[1]',
            'flex flex-col gap-3.5',
            'lg:grid lg:grid-cols-12 lg:items-start lg:gap-7 xl:gap-8',
          )}
        >
          <div
            className={cn(
              'min-w-0 lg:col-span-5',
              photoFirst ? 'lg:order-1' : 'lg:order-2',
            )}
          >
            <PricingCategoryPhoto
              category={group.category}
              image={activeImage}
              productLabel={photoItem?.name}
              priority={index === 0}
            />
          </div>

          <div
            className={cn(
              'pricing-category-rack__rates flex min-w-0 flex-col justify-start',
              'lg:col-span-7',
              photoFirst ? 'lg:order-2' : 'lg:order-1',
            )}
          >
            <div className="pricing-category-rack__label mb-1.5 flex items-center gap-2">
              <span className="pricing-category-rack__rod-mark" aria-hidden />
              <h3
                id={headingId}
                className="text-base font-semibold leading-none sm:text-lg"
                style={{ color: 'var(--atelier-ink)' }}
              >
                {label}
              </h3>
            </div>

            <div className="pricing-category-rack__rail-wrap relative max-w-full">
              <PricingPegRail />
              <div
                ref={scrollerRef}
                className="pricing-rack-scroller"
                role="list"
                aria-label={scrollerLabel}
                data-scrolling={isScrolling ? 'true' : 'false'}
              >
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.catalog_item_id}
                    role="listitem"
                    data-rack-item={itemIndex}
                    data-active={itemIndex === activeIndex ? 'true' : 'false'}
                    className="pricing-rack-scroller__item"
                  >
                    <PricingPriceTag
                      name={item.name}
                      unit={item.unit}
                      lines={getPricingTagLines(item, group)}
                      swayPhase={(itemIndex % 7) / 7}
                      spotlight={itemIndex === activeIndex}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pricing-category-rack__conveyor relative z-[1]" aria-hidden />
      </section>
    </PricingRailReveal>
  );
}
