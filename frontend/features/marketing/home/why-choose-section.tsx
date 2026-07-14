import type { LucideIcon } from 'lucide-react';
import {
  BadgeIndianRupee,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
  WashingMachine,
} from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { GlassSurface } from '@/components/ui/glass-surface';
import {
  GLASS_MOBILE_TRANSPARENT,
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

const WHY_CHOOSE_ITEMS = [
  {
    id: 'professional-care',
    title: 'Professional Care',
    description:
      'Expert handling for every garment type, from everyday cotton to delicate silks and woolens.',
    icon: Sparkles,
    iconClassName: 'text-brand-500',
  },
  {
    id: 'premium-machines',
    title: 'Premium Machines',
    description:
      'Industrial-grade washers and dryers deliver a deeper clean with less wear on your fabrics.',
    icon: WashingMachine,
    iconClassName: 'text-info',
  },
  {
    id: 'safe-for-fabric',
    title: 'Safe for Fabric',
    description:
      'Gentle detergents and proven processes protect colors, textures, and garment shape wash after wash.',
    icon: ShieldCheck,
    iconClassName: 'text-success',
  },
  {
    id: 'timely-delivery',
    title: 'Timely Delivery',
    description:
      'Reliable pickup and drop-off windows so your laundry is back when you need it.',
    icon: Truck,
    iconClassName: 'text-warning',
  },
  {
    id: 'affordable-pricing',
    title: 'Affordable Pricing',
    description:
      'Transparent per-kg rates with no hidden fees — quality care that fits your budget.',
    icon: BadgeIndianRupee,
    iconClassName: 'text-brand-600',
  },
  {
    id: 'customer-support',
    title: '24/7 Customer Support',
    description:
      'WhatsApp and phone support around the clock for booking help, order updates, and questions.',
    icon: Headphones,
    iconClassName: 'text-primary',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}>;

function WhyChooseIconChip({
  icon: Icon,
  iconClassName,
}: {
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
        'border border-border/50 bg-background/55 shadow-sm max-md:[backdrop-filter:none] md:backdrop-blur-sm',
        iconClassName,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
    </div>
  );
}

export function WhyChooseSection() {
  return (
    <section
      aria-labelledby="why-choose-title"
      className={cn('bg-card', MARKETING_SECTION_PY)}
    >
      <div className={MARKETING_CONTAINER}>
        <SectionHeader
          title="Why Choose Us"
          description="Everything you need for stress-free laundry — from pickup to delivery."
          align="center"
          className="mb-10"
        />

        <GlassSurface
          variant="subtle"
          className={cn(
            'rounded-2xl',
            GLASS_MOBILE_TRANSPARENT,
            'md:p-6 lg:p-8',
          )}
        >
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
            {WHY_CHOOSE_ITEMS.map(({ id, title, description, icon, iconClassName }) => (
              <li key={id}>
                <WhyChooseIconChip icon={icon} iconClassName={iconClassName} />
                <h3 className="mt-4 text-lg font-bold text-foreground sm:text-xl">{title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </GlassSurface>
      </div>
    </section>
  );
}
