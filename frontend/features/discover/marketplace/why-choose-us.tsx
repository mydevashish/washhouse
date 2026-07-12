'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BadgeIndianRupee, Package, ShieldCheck, Truck } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    title: 'Free pickup',
    description: 'Schedule a slot and we collect from your doorstep at no extra charge.',
    icon: Package,
  },
  {
    title: 'Fast delivery',
    description: 'Standard and express turnaround options so you are never stuck without clothes.',
    icon: Truck,
  },
  {
    title: 'Affordable pricing',
    description: 'Per-kg transparency with no surprise fees — see costs before you confirm.',
    icon: BadgeIndianRupee,
  },
  {
    title: 'Quality guaranteed',
    description: 'Verified partners, ratings, and reviews so you always know who is handling your clothes.',
    icon: ShieldCheck,
  },
] as const;

export function WhyChooseUs() {
  return (
    <Section id="why-us" tone="default" ariaLabel="Why choose DLM">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="Why DLM"
            title="Built for busy households"
            description="We combine marketplace choice with doorstep convenience — the best of local laundries, without the hassle."
          />
        </FadeInItem>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: (typeof FEATURES)[number]) {
  const reduce = useReducedMotion();

  return (
    <FadeInItem>
      <motion.div
        className={cn(
          'flex h-full flex-col rounded-2xl border border-border bg-bg-0 p-6 text-left shadow-soft sm:p-8',
          'transition-colors hover:border-brand-500/25',
        )}
        whileHover={reduce ? undefined : { scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-fg-0">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-fg-1 sm:text-base">{description}</p>
      </motion.div>
    </FadeInItem>
  );
}
