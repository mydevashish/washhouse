'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shirt, ShoppingBasket, Sparkles, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  {
    id: 'wash-fold',
    title: 'Wash & Fold',
    description: 'Everyday clothes washed, dried, and neatly folded — ideal for weekly laundry.',
    icon: ShoppingBasket,
    accent: 'bg-brand-50 text-brand-500 dark:bg-brand-900/30',
  },
  {
    id: 'dry-clean',
    title: 'Dry Cleaning',
    description: 'Premium care for suits, sarees, and delicate fabrics that need specialist handling.',
    icon: Shirt,
    accent: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
  },
  {
    id: 'ironing',
    title: 'Ironing',
    description: 'Crisp, wrinkle-free finishes for office wear and formal outfits.',
    icon: Sparkles,
    accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  },
  {
    id: 'express',
    title: 'Express Service',
    description: 'Same-day or next-day turnaround when you are on a tight schedule.',
    icon: Truck,
    accent: 'bg-warning-muted text-warning',
  },
] as const;

function CategoryCard({
  title,
  description,
  icon: Icon,
  accent,
}: (typeof CATEGORIES)[number]) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      className={cn(
        'group flex h-full flex-col rounded-2xl border border-border bg-bg-0 p-6 shadow-soft sm:p-8',
        'transition-shadow hover:border-brand-500/25 hover:shadow-pop',
      )}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', accent)}>
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-fg-0">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-1 sm:text-base">{description}</p>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mt-6 w-fit gap-1 px-0 text-brand-500 hover:bg-transparent hover:text-brand-600"
      >
        <Link href="#partners">
          Find partners
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </Button>
    </motion.article>
  );
}

export function ServiceCategories() {
  return (
    <Section id="services" tone="default" ariaLabel="Laundry services">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="Services"
            title="Everything your wardrobe needs"
            description="Pick the service type that matches your clothes. Exact pricing is shown on each partner's page."
          />
        </FadeInItem>
        <FadeInItem>
          <InfoBanner className="mb-8 sm:mb-10">
            Not sure what to choose? Start with <strong className="text-fg-0">Wash & Fold</strong> for regular
            clothes, or <strong className="text-fg-0">Dry Cleaning</strong> for formal wear.
          </InfoBanner>
        </FadeInItem>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <FadeInItem key={cat.id}>
              <CategoryCard {...cat} />
            </FadeInItem>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}
