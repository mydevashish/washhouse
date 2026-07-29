'use client';

import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  Gift,
  History,
  MapPinned,
  Smartphone,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/features/discover/marketplace/fade-in';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { cn } from '@/lib/utils';

const APP_FEATURES = [
  {
    id: 'quick-booking',
    title: 'Quick Booking',
    description: 'Schedule pickup in seconds — pick your laundry, services, and time slot.',
    icon: CalendarClock,
    iconClassName: 'text-brand-500',
  },
  {
    id: 'live-tracking',
    title: 'Live Tracking',
    description: 'Follow your order from pickup through wash, QC, and doorstep delivery.',
    icon: MapPinned,
    iconClassName: 'text-info',
  },
  {
    id: 'order-history',
    title: 'Order History',
    description: 'Rebook your favourite services and review past orders anytime.',
    icon: History,
    iconClassName: 'text-primary',
  },
  {
    id: 'offers',
    title: 'Offers',
    description: 'Exclusive app-only deals, welcome codes, and seasonal promotions.',
    icon: Gift,
    iconClassName: 'text-warning',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}>;

function AppFeatureRow({
  title,
  description,
  icon: Icon,
  iconClassName,
}: (typeof APP_FEATURES)[number]) {
  return (
    <li className="flex gap-3 sm:gap-4">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11',
          'border border-border/50 bg-background/55 shadow-sm max-md:[backdrop-filter:none] md:backdrop-blur-sm',
          iconClassName,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-foreground sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground sm:mt-1">
          {description}
        </p>
      </div>
    </li>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[13.5rem] overflow-hidden sm:max-w-[17.5rem] lg:mx-0 lg:max-w-[20rem]">
      <div
        className="pointer-events-none absolute inset-0 scale-110 rounded-[3rem] bg-brand-500/15 blur-3xl"
        aria-hidden
      />
      <div className="relative rounded-[2rem] border-[8px] border-foreground/90 bg-foreground/90 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] sm:rounded-[2.5rem] sm:border-[10px] sm:p-2">
        <div className="overflow-hidden rounded-[1.5rem] bg-background sm:rounded-[1.85rem]">
          <div className="flex items-center justify-center bg-foreground/90 py-1.5 sm:py-2">
            <div className="h-1.5 w-14 rounded-full bg-background/25 sm:w-16" aria-hidden />
          </div>

          {/* Fixed content height — avoid tall empty aspect ratio on mobile */}
          <div className="relative bg-gradient-to-b from-brand-50/80 via-background to-muted/40 dark:from-brand-900/20">
            <div className="border-b border-border/50 bg-card/90 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
                  <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">WashHouse</p>
                  <p className="text-[0.625rem] text-muted-foreground">Premium laundry</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 sm:space-y-2.5 sm:p-4">
              <div className="rounded-xl border border-border/50 bg-card/90 p-2.5 shadow-soft sm:p-3">
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Next pickup
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">Tomorrow, 10–12 AM</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-brand-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['Track', 'History', 'Offers', 'Book'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border/40 bg-card/80 px-2 py-2 text-center text-[0.625rem] font-semibold text-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-brand-500/40 bg-brand-50/50 px-3 py-2 dark:bg-brand-900/20">
                <p className="text-[0.625rem] font-bold text-brand-600 dark:text-brand-50">
                  WELCOME20 — 20% off
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreBadgeButton({
  store,
  label,
  sublabel,
}: {
  store: 'google-play' | 'app-store';
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={`${label} — Coming Soon`}
      className={cn(
        'relative flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border border-border/70',
        'bg-card/90 px-4 py-2.5 text-left shadow-soft',
        'disabled:cursor-not-allowed disabled:opacity-90',
        'sm:w-auto sm:min-w-[12rem]',
      )}
    >
      {store === 'google-play' ? (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-foreground" aria-hidden>
          <path
            fill="currentColor"
            d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1l10.2-10.2L3.6 1.8zm11.3 9.1 2.5 2.5-8.8 5.1 6.3-7.6zm1.2-1.4 2.8 1.6c.8.5.8 1.7 0 2.2l-2.8 1.6-2.7-2.7 2.7-2.7zm-1.2 4.8-6.3 7.6 8.8-5.1-2.5-2.5z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-foreground" aria-hidden>
          <path
            fill="currentColor"
            d="M16.8 12.2c-.1-2.1 1.7-3.1 1.8-3.2-1-.1-2-.6-2.6-1.3-.6-.7-1-1.7-1-2.7-.1-1.1.3-2.1.9-2.8 1.2-1.4 3.2-1.2 4-.9-.1.9-.5 1.7-1.1 2.4-.7.8-1.7 1.3-2.8 1.5zm-1.2 4.1c.5 0 2.3.2 3.5 1.7-1 .9-2 1.4-3 1.4-1.1 0-1.6-.5-2.9-.5-1.3 0-1.9.5-2.9.5-1 0-2.1-.6-3-1.6 1.6-2.2 4.5-6.3 4.5-8.8 0-1.6-.9-2.5-1.7-2.5-.7 0-1.3.4-2 .4-.8 0-1.5-.4-2.3-.4-1.2 0-2.5 1.1-2.5 3 0 2.3 2.2 6.1 3.5 8.1.7 1.1 1.4 1.7 2.2 1.7z"
          />
        </svg>
      )}
      <span className="min-w-0 flex-1 pr-16">
        <span className="block text-[0.625rem] uppercase tracking-wide text-muted-foreground">
          {sublabel}
        </span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
      </span>
      <Badge
        variant="warning"
        className="absolute right-2 top-1/2 shrink-0 -translate-y-1/2 shadow-sm sm:right-2.5"
      >
        Coming Soon
      </Badge>
    </button>
  );
}

export function AppPromoSection() {
  return (
    <MarketingSection
      aria-labelledby="app-promo-title"
      alternate
      header={{
        eyebrow: 'Mobile app',
        title: 'Laundry care in your pocket',
        description:
          'Book pickups, track every load, and unlock member offers — all from one app.',
        align: 'center',
      }}
    >
      {/* No FadeInItem: store badges / features must stay visible (WCAG 2.4.7). */}
      <FadeIn>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
          {/* Features + badges first on mobile so they sit under the section header */}
          <div className="order-1 lg:order-2">
            <h2 id="app-promo-title" className="sr-only">
              WashHouse mobile app features
            </h2>

            <ul className="space-y-5 sm:space-y-7">
              {APP_FEATURES.map((feature) => (
                <AppFeatureRow key={feature.id} {...feature} />
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <StoreBadgeButton store="google-play" sublabel="Get it on" label="Google Play" />
              <StoreBadgeButton store="app-store" sublabel="Download on the" label="App Store" />
            </div>
          </div>

          <div className="order-2 lg:order-1">
            <PhoneMockup />
          </div>
        </div>
      </FadeIn>
    </MarketingSection>
  );
}
