'use client';

import { CalendarClock, Package, Sparkles } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';

const STEPS = [
  {
    step: '1',
    title: 'Choose a laundry',
    description: 'Compare ratings, prices, and delivery times from verified partners near you.',
    icon: Sparkles,
  },
  {
    step: '2',
    title: 'Schedule pickup',
    description: 'Pick services, set a pickup slot, and we collect from your doorstep — free.',
    icon: CalendarClock,
  },
  {
    step: '3',
    title: 'Get fresh delivery',
    description: 'Track your order in real time and receive clean, folded clothes back at home.',
    icon: Package,
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="muted" ariaLabel="How DLM works">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="How it works"
            title="Laundry in three simple steps"
            description="New here? DLM connects you with trusted local laundries — no shop visits, no guesswork."
          />
        </FadeInItem>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ step, title, description, icon: Icon }) => (
            <FadeInItem key={step}>
              <li className="relative flex h-full list-none flex-col rounded-2xl border border-border bg-bg-0 p-6 shadow-soft sm:p-8">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
                  aria-hidden
                >
                  {step}
                </span>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-bg-1 text-brand-500">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-fg-0">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-1 sm:text-base">{description}</p>
              </li>
            </FadeInItem>
          ))}
        </ol>
      </FadeIn>
    </Section>
  );
}
