'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import {
  SERVICE_PREVIEW_ITEMS,
  type ServicePreviewItem,
} from '@/features/marketing/home/services-data';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

const BOOK_NOW_HREF = '/discover#laundries';

type ServicePreviewCardProps = {
  item: ServicePreviewItem;
  enableHoverLift?: boolean;
};

function ServicePreviewCard({ item, enableHoverLift = false }: ServicePreviewCardProps) {
  const { title, description, icon: Icon, accent, priceFrom } = item;

  return (
    <article
      className={cn(
        'h-full',
        enableHoverLift &&
          'transition-[transform,box-shadow] duration-200 lg:hover:-translate-y-1 lg:hover:shadow-[var(--shadow-card-hover)]',
      )}
    >
      <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="flex h-full flex-col p-6">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {priceFrom ? (
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Starting from </span>
              <span className="font-semibold text-primary">{priceFrom}</span>
            </p>
          ) : null}

          <Button asChild size="default" className="mt-5 w-full rounded-full">
            <Link href={BOOK_NOW_HREF}>
              Book now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
}

export function ServicesPreview() {
  const reduce = usePrefersReducedMotion();

  return (
    <section aria-labelledby="services-preview-title" className="bg-card py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <SectionHeader
              eyebrow="Services"
              title="Everything your wardrobe needs"
              description="From everyday wash & fold to express dry cleaning — pick what fits your week."
              align="center"
              className="mb-10"
            />
          </FadeInItem>

          {/* Mobile + tablet: horizontal scroll-snap carousel */}
          <div
            className="lg:hidden -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 scrollbar-none snap-x snap-mandatory sm:-mx-6 sm:px-6"
            aria-label="Browse our laundry services — swipe horizontally to see more"
            role="region"
            tabIndex={0}
          >
            <ul className="flex gap-4">
              {SERVICE_PREVIEW_ITEMS.map((item) => (
                <li key={item.id} className="w-[min(85vw,calc(100vw-2rem))] max-w-sm shrink-0 snap-start">
                  <ServicePreviewCard item={item} />
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop: 3-column grid with hover lift */}
          <ul className="hidden grid-cols-3 gap-6 lg:grid">
            {SERVICE_PREVIEW_ITEMS.map((item) => (
              <li key={item.id}>
                <FadeInItem>
                  <ServicePreviewCard item={item} enableHoverLift={!reduce} />
                </FadeInItem>
              </li>
            ))}
          </ul>

          <FadeInItem>
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="/services">
                  View all services
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
