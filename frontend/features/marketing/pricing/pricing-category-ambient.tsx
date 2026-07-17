'use client';

import Image from 'next/image';

import type { CatalogCategory } from '@/features/laundry-price-list/types';
import { getPricingCategoryAmbient } from '@/features/marketing/pricing/pricing-category-images';
import { cn } from '@/lib/utils';

type PricingCategoryAmbientProps = {
  category: CatalogCategory;
  /**
   * Bias the misted wash toward the editorial photo column.
   * `start` = photo left (even racks); `end` = photo right (odd racks).
   */
  anchor?: 'start' | 'end';
  className?: string;
};

/**
 * Soft, blurred category imagery behind the full photo+rates unit.
 * Decorative only — no text overlays; tickets stay above at z-index 1.
 * Women/kids (`data-strength=rich`) get a light fabric tint wash.
 */
export function PricingCategoryAmbient({
  category,
  anchor = 'start',
  className,
}: PricingCategoryAmbientProps) {
  const { src, strength } = getPricingCategoryAmbient(category);

  return (
    <div
      className={cn('pricing-category-rack__ambient', className)}
      data-anchor={anchor}
      data-strength={strength}
      data-category={category}
      aria-hidden
    >
      <div className="pricing-category-rack__ambient-frame">
        <Image
          src={src}
          alt=""
          fill
          /* Blurred ambient — half marketing width is enough; avoid 1440@2x downloads */
          sizes="(max-width: 1023px) 100vw, 720px"
          loading="lazy"
          decoding="async"
          className="pricing-category-rack__ambient-media"
        />
      </div>
      {/* Fabric tint wash — women/kids get distinctive depth without covering prices */}
      <div className="pricing-category-rack__ambient-tint" />
      <div className="pricing-category-rack__ambient-veil" />
    </div>
  );
}
