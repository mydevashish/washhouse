'use client';

import { Clock, Zap } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { cn } from '@/lib/utils';

const BOOK_NOW_HREF = '/discover#laundries';

const DELIVERY_OPTIONS = [
  {
    id: 'regular',
    title: 'Regular Delivery',
    turnaround: '48–72 Hours',
    pricing: 'Normal charges',
    icon: Clock,
    iconClassName: 'bg-brand-500/10 text-brand-500',
    popular: false,
    desktopPosition: 'left',
  },
  {
    id: 'express',
    title: 'Express Delivery',
    turnaround: '24 Hours',
    pricing: 'Extra charges',
    icon: Zap,
    iconClassName: 'bg-warning-muted text-warning',
    popular: true,
    desktopPosition: 'right',
  },
] as const;

function PopularCornerRibbon() {
  return (
    <div
      className="pointer-events-none absolute right-0 top-0 z-10 h-20 w-20 overflow-hidden"
      aria-hidden
    >
      <span className="absolute right-[-2.35rem] top-[1.15rem] w-[9.75rem] rotate-45 bg-brand-500 py-1 text-center text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
        POPULAR
      </span>
    </div>
  );
}

type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

function DeliveryOptionCard({
  option,
  titleId,
}: {
  option: DeliveryOption;
  titleId?: string;
}) {
  const {
    title,
    turnaround,
    pricing,
    icon: Icon,
    iconClassName,
    popular,
    desktopPosition,
  } = option;

  return (
    <MarketingGlassCard
      solidOnMobile
      titleId={titleId}
      cta={{ href: BOOK_NOW_HREF, label: 'Book Now' }}
      className={cn(
        'relative h-full overflow-hidden',
        desktopPosition === 'left' && 'md:rounded-r-none',
        desktopPosition === 'right' &&
          'md:rounded-l-none md:border-l md:border-border/60',
      )}
      iconSlot={
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      }
      title={title}
    >
      {popular ? <PopularCornerRibbon /> : null}

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
          <dt className="text-xs font-medium text-foreground/70">Turnaround</dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground">{turnaround}</dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
          <dt className="text-xs font-medium text-foreground/70">Pricing</dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground">{pricing}</dd>
        </div>
      </dl>
    </MarketingGlassCard>
  );
}

export function DeliveryOptionsBand() {
  return (
    <MarketingSection
      aria-labelledby="delivery-options-title"
      className="border-y border-border/60 bg-background"
      header={{
        eyebrow: 'Delivery',
        title: 'Pick the pace that fits your week',
        description:
          'Standard turnaround for everyday loads, or express when you need clothes back in a day.',
        align: 'center',
      }}
    >
      <FadeIn>
        <div className="flex flex-col-reverse gap-4 md:grid md:grid-cols-2 md:gap-0">
          {DELIVERY_OPTIONS.map((option) => (
            <FadeInItem key={option.id} className="h-full">
              <DeliveryOptionCard
                option={option}
                titleId={option.id === 'regular' ? 'delivery-options-title' : undefined}
              />
            </FadeInItem>
          ))}
        </div>
      </FadeIn>
    </MarketingSection>
  );
}
