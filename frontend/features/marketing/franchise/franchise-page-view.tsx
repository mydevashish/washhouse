import {
  BadgeCheck,
  Mail,
  GraduationCap,
  Headphones,
  IndianRupee,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { HERO_SLIDE_IMAGES } from '@/features/discover/marketplace/laundry-images';
import { FranchiseApplicationForm } from '@/features/marketing/franchise/franchise-application-form';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { cn } from '@/lib/utils';

const FRANCHISE_BENEFITS = [
  {
    title: 'Low Investment',
    description: 'Start with a proven laundry model and lower upfront risk than building alone.',
    icon: IndianRupee,
  },
  {
    title: 'Setup & Training',
    description: 'Full onboarding, equipment guidance, and staff training from day one.',
    icon: GraduationCap,
  },
  {
    title: 'Marketing Support',
    description: 'Brand campaigns, local listings, and digital demand to fill your order book.',
    icon: Megaphone,
  },
  {
    title: 'Ongoing Assistance',
    description: 'Operations support and a dedicated partner success team when you need help.',
    icon: Headphones,
  },
  {
    title: 'Proven Model',
    description: 'Join India\'s growing doorstep laundry marketplace with verified demand.',
    icon: BadgeCheck,
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}>;

const STOREFRONT_IMAGE = HERO_SLIDE_IMAGES.partner;

function FranchiseHero() {
  return (
    <header className="relative isolate overflow-hidden">
      <Image
        src={STOREFRONT_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/90 to-brand-900/95"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <GlassSurface
          variant="strong"
          className="mx-auto max-w-3xl rounded-2xl px-6 py-8 text-center sm:px-10 sm:py-10"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-on-hero-muted sm:text-sm">
            Franchise
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-on-hero text-balance sm:text-4xl lg:text-5xl">
            Become a The WashHouse Partner
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-on-hero-muted sm:text-lg">
            Grow your laundry business with India&apos;s doorstep marketplace. We bring customers
            and bookings — you deliver quality wash, iron, and delivery.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <Link href="#apply">Apply for franchise</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'h-11 rounded-full border-on-hero/40 bg-white/10 px-6 text-on-hero shadow-soft backdrop-blur-sm',
                'hover:bg-white/15 hover:text-on-hero',
              )}
            >
              <Link href="/contact?subject=franchise">
                <Mail className="h-4 w-4" aria-hidden />
                Request brochure
              </Link>
            </Button>
          </div>
        </GlassSurface>
      </div>
    </header>
  );
}

export function FranchisePageView() {
  return (
    <div className="bg-background">
      <FranchiseHero />

      <MarketingSection
        aria-labelledby="franchise-benefits-title"
        header={{
          eyebrow: 'Why partner',
          title: 'Everything you need to launch and grow',
          description:
            'From setup to ongoing support — we help you build a laundry business customers trust.',
          align: 'center',
        }}
      >
        <h2 id="franchise-benefits-title" className="sr-only">
          Franchise benefits
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FRANCHISE_BENEFITS.map(({ title, description, icon: Icon }) => (
            <li key={title} className="min-h-full">
              <MarketingGlassCard
                glassVariant="subtle"
                enableHoverLift
                iconSlot={
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                }
                title={title}
                description={description}
              />
            </li>
          ))}
        </ul>
      </MarketingSection>

      <section
        id="apply"
        aria-labelledby="franchise-apply-section-title"
        className="scroll-mt-20 border-t border-border bg-muted/30 py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <h2 id="franchise-apply-section-title" className="sr-only">
            Franchise application
          </h2>
          <div className="mx-auto max-w-2xl">
            <MarketingGlassCard glassVariant="default" solidOnMobile={false} className="p-6 sm:p-8">
              <FranchiseApplicationForm />
            </MarketingGlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
