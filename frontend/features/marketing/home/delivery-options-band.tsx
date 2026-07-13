'use client';

import { Clock, Zap } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { GlassSurface } from '@/components/ui/glass-surface';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { cn } from '@/lib/utils';

const DELIVERY_OPTIONS = [
  {
    id: 'regular',
    title: 'Regular delivery',
    turnaround: '48–72 hours',
    pricing: 'Standard store rates',
    description:
      'Best for weekly laundry. Schedule pickup, and your store returns clothes when processing is complete — no rush fees.',
    icon: Clock,
    iconClassName: 'bg-primary/10 text-primary',
    badge: 'Most popular',
  },
  {
    id: 'express',
    title: 'Express delivery',
    turnaround: '24 hours',
    pricing: 'Premium pricing',
    description:
      'Need clothes back tomorrow? Choose express at checkout when your partner offers it — ideal before trips or events.',
    icon: Zap,
    iconClassName: 'bg-warning-muted text-warning',
    badge: 'Fastest',
  },
] as const;

export function DeliveryOptionsBand() {
  return (
    <section
      aria-labelledby="delivery-options-title"
      className="border-y border-border/60 bg-background py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <SectionHeader
              eyebrow="Delivery"
              title="Pick the pace that fits your week"
              description="Standard turnaround for everyday loads, or express when you need clothes back in a day."
              align="center"
              className="mb-10"
            />
          </FadeInItem>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {DELIVERY_OPTIONS.map(
              ({ id, title, turnaround, pricing, description, icon: Icon, iconClassName, badge }) => (
                <FadeInItem key={id}>
                  <GlassSurface
                    variant="default"
                    className="flex h-full flex-col rounded-2xl p-6 sm:p-8"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                          iconClassName,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {badge}
                      </span>
                    </div>

                    <h3
                      id={id === 'regular' ? 'delivery-options-title' : undefined}
                      className="mt-4 text-xl font-bold text-foreground"
                    >
                      {title}
                    </h3>

                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
                        <dt className="text-xs font-medium text-muted-foreground">Turnaround</dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">{turnaround}</dd>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
                        <dt className="text-xs font-medium text-muted-foreground">Pricing</dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">{pricing}</dd>
                      </div>
                    </dl>

                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </GlassSurface>
                </FadeInItem>
              ),
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
