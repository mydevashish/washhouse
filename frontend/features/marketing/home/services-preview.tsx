'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import {
  SERVICE_PREVIEW_ITEMS,
  type ServicePreviewItem,
} from '@/features/marketing/home/services-data';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { cn } from '@/lib/utils';

const BOOK_NOW_HREF = '/discover#laundries';

type ServicePreviewCardProps = {
  item: ServicePreviewItem;
  enableHoverLift?: boolean;
  solidOnMobile?: boolean;
};

function ServicePreviewCard({
  item,
  enableHoverLift = false,
  solidOnMobile = true,
}: ServicePreviewCardProps) {
  const { title, description, image, imageAlt } = item;

  return (
    <MarketingGlassCard
      enableHoverLift={enableHoverLift}
      solidOnMobile={solidOnMobile}
      className="overflow-hidden !p-0"
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 414px) 83vw, (max-width: 768px) 83vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 320px"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-bold text-foreground sm:text-xl">{title}</h3>
        <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-foreground/80">
          {description}
        </p>

        <Link
          href={BOOK_NOW_HREF}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
        >
          Book Now
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </MarketingGlassCard>
  );
}

function desktopItemClass(index: number) {
  return cn(
    'lg:col-span-3',
    index === 4 && 'lg:col-start-2',
  );
}

export function ServicesPreview() {
  return (
    <MarketingSection
      aria-labelledby="services-preview-title"
      className="bg-card"
      header={{
        title: 'Our Laundry Services',
        description: 'Professional care for every fabric',
        align: 'center',
      }}
    >
      <FadeIn>
        {/* Mobile: horizontal scroll-snap carousel (~1.2 cards visible) */}
        <div
          className="md:hidden -mx-4 min-w-0 w-full overflow-x-auto overscroll-x-contain px-4 pb-2 scrollbar-none snap-x snap-mandatory"
          aria-label="Browse our laundry services — swipe horizontally to see more"
          role="region"
          tabIndex={0}
        >
          <ul className="flex gap-4">
            {SERVICE_PREVIEW_ITEMS.map((item) => (
              <li key={item.id} className="w-[83.333%] max-w-sm shrink-0 snap-start">
                <ServicePreviewCard item={item} />
              </li>
            ))}
          </ul>
        </div>

        {/* Tablet: 2-column grid */}
        <ul className="hidden gap-5 md:grid md:grid-cols-2 lg:hidden">
          {SERVICE_PREVIEW_ITEMS.map((item) => (
            <li key={item.id}>
              <FadeInItem>
                <ServicePreviewCard item={item} solidOnMobile={false} />
              </FadeInItem>
            </li>
          ))}
        </ul>

        {/* Desktop: 4-column row + centered 3-column row */}
        <ul className="hidden gap-6 lg:grid lg:grid-cols-12">
          {SERVICE_PREVIEW_ITEMS.map((item, index) => (
            <li key={item.id} className={desktopItemClass(index)}>
              <FadeInItem>
                <ServicePreviewCard item={item} enableHoverLift solidOnMobile={false} />
              </FadeInItem>
            </li>
          ))}
        </ul>
      </FadeIn>
    </MarketingSection>
  );
}
