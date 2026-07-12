'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Basic',
    subtitle: 'Wash & Fold',
    price: '₹99',
    unit: '/kg',
    features: ['Wash & dry', 'Neat folding', '48h standard delivery'],
    highlighted: false,
  },
  {
    name: 'Standard',
    subtitle: 'Wash + Iron',
    price: '₹149',
    unit: '/kg',
    features: ['Everything in Basic', 'Professional ironing', '36h delivery'],
    highlighted: false,
  },
  {
    name: 'Premium',
    subtitle: 'Dry Clean + Iron',
    price: '₹249',
    unit: '/kg',
    features: ['Premium dry clean', 'Stain treatment', 'Express 24h option'],
    highlighted: true,
  },
] as const;

export function PricingSection() {
  return (
    <Section id="pricing" tone="muted" ariaLabel="Pricing plans">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, transparent plans"
            description="Indicative per-kg rates. Your final bill depends on the partner, garment type, and services you select at checkout."
          />
        </FadeInItem>
        <FadeInItem>
          <InfoBanner title="No hidden fees" className="mb-8 sm:mb-10">
            Pickup and delivery are included. You only pay for the services you choose — no platform subscription.
          </InfoBanner>
        </FadeInItem>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <FadeInItem key={plan.name}>
              <article
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border p-6 shadow-soft transition-shadow hover:shadow-pop sm:p-8',
                  plan.highlighted
                    ? 'border-brand-500 bg-bg-0 ring-2 ring-brand-500/15'
                    : 'border-border bg-bg-0',
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold text-brand-500">{plan.name}</p>
                <h3 className="mt-1 text-xl font-bold text-fg-0">{plan.subtitle}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-bold tracking-tight text-fg-0">{plan.price}</span>
                  <span className="text-fg-2">{plan.unit}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3" aria-label={`${plan.name} plan features`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-fg-1">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full rounded-xl" variant={plan.highlighted ? 'default' : 'outline'}>
                  <Link href="#partners">Choose a partner</Link>
                </Button>
              </article>
            </FadeInItem>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}
