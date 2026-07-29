'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { FadeIn } from '@/features/discover/marketplace/fade-in';
import { BookNowLink } from '@/features/marketing/book-now';
import type { BookNowServiceId } from '@/features/marketing/book-now';
import {
  SERVICE_PREVIEW_ITEMS,
  type ServicePreviewItem,
} from '@/features/marketing/home/services-data';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { PricingMotionBudgetProvider } from '@/features/marketing/pricing/pricing-motion-budget';
import { useAtelierProductSway } from '@/features/marketing/pricing/use-atelier-product-sway';
import { HORIZONTAL_SCROLL_NATIVE_CLASS } from '@/lib/horizontal-scroll-touch';
import { cn } from '@/lib/utils';

import '@/features/marketing/pricing/pricing-atelier.css';

/** One primary image set — matches visible card widths (carousel / 2-col / 4-col). */
const SERVICE_PREVIEW_IMAGE_SIZES =
  '(max-width: 767px) 83vw, (max-width: 1023px) 45vw, (max-width: 1279px) 22vw, 280px';

type ServicePreviewCardProps = {
  item: ServicePreviewItem;
  index?: number;
  enableHoverLift?: boolean;
  solidOnMobile?: boolean;
};

function ServicePreviewCard({
  item,
  index = 0,
  enableHoverLift = false,
  solidOnMobile = true,
}: ServicePreviewCardProps) {
  const { id, title, description, image, imageAlt } = item;
  const isMoreServices = id === 'more-services';
  const { ref, swayOn } = useAtelierProductSway<HTMLDivElement>({ amount: 0.2 });
  const phaseAlt = index % 2 === 1;

  return (
    <MarketingGlassCard
      enableHoverLift={enableHoverLift}
      solidOnMobile={solidOnMobile}
      className="overflow-hidden !p-0"
    >
      <div
        ref={ref}
        className="pricing-category-photo relative aspect-[4/3] w-full overflow-hidden !rounded-none !shadow-none"
      >
        <div
          className="pricing-category-photo__sway"
          data-sway={swayOn ? 'on' : 'off'}
          data-phase={phaseAlt ? 'alt' : 'main'}
          style={
            {
              '--tag-sway-amp': '0.55deg',
              animationDelay: swayOn ? `${(index % 5) * -0.7}s` : undefined,
            } as CSSProperties
          }
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes={SERVICE_PREVIEW_IMAGE_SIZES}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-bold text-foreground sm:text-xl">{title}</h3>
        <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-foreground/80">
          {description}
        </p>

        {isMoreServices ? (
          <Link
            href="/services"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
          >
            View services
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <BookNowLink
            service={id as BookNowServiceId}
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
          >
            Book Now
            <ArrowRight className="h-4 w-4" aria-hidden />
          </BookNowLink>
        )}
      </div>
    </MarketingGlassCard>
  );
}

function desktopItemClass(index: number) {
  return cn('lg:col-span-3', index === 4 && 'lg:col-start-2');
}

export function ServicesPreview() {
  return (
    <MarketingSection
      aria-labelledby="services-preview-title"
      className="bg-card"
      containerClassName="min-w-0 max-w-full overflow-x-hidden"
      header={{
        title: 'Our Laundry Services',
        description: 'Professional care for every fabric',
        align: 'center',
      }}
    >
      <PricingMotionBudgetProvider>
        <FadeIn>
          {/*
            Single DOM list — CSS switches layout (carousel → 2-col → 12-col).
            Avoids triple-mounting 21 next/image instances / absurd srcSet widths.
          */}
          <ul
            className={cn(
              // Mobile: horizontal scroll-snap carousel (~1.2 cards visible)
              '-mx-4 flex min-w-0 w-[calc(100%+2rem)] max-w-none gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 scrollbar-none snap-x snap-mandatory',
              HORIZONTAL_SCROLL_NATIVE_CLASS,
              // Tablet+: grid replaces flex scroll
              'md:mx-0 md:grid md:w-full md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:snap-none',
              // Desktop: 4-col row + centered 3-col row
              'lg:grid-cols-12 lg:gap-6',
            )}
            aria-label="Browse our laundry services — swipe horizontally to see more"
            role="region"
            tabIndex={0}
          >
            {SERVICE_PREVIEW_ITEMS.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  'w-[83.333%] max-w-sm shrink-0 snap-start',
                  'md:w-auto md:max-w-none md:shrink',
                  desktopItemClass(index),
                )}
              >
                <ServicePreviewCard
                  item={item}
                  index={index}
                  enableHoverLift
                  solidOnMobile
                />
              </li>
            ))}
          </ul>
        </FadeIn>
      </PricingMotionBudgetProvider>
    </MarketingSection>
  );
}
