'use client';

import {
  ArrowRight,
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
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { CONTACT_FRANCHISE_BROCHURE_HREF } from '@/features/marketing/contact/contact-constants';
import {
  GLASS_ON_DARK_GRADIENT,
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

const FRANCHISE_BENEFITS = [
  { label: 'Low Investment', icon: IndianRupee },
  { label: 'Setup & Training', icon: GraduationCap },
  { label: 'Marketing Support', icon: Megaphone },
  { label: 'Ongoing Assistance', icon: Headphones },
  { label: 'Proven Model', icon: BadgeCheck },
] as const satisfies ReadonlyArray<{ label: string; icon: LucideIcon }>;

const STOREFRONT_IMAGE = HERO_SLIDE_IMAGES.partner;

export function FranchiseTeaser() {
  return (
    <section
      aria-labelledby="franchise-teaser-title"
      className={cn('relative isolate overflow-hidden', MARKETING_SECTION_PY)}
    >
      <Image
        src={STOREFRONT_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/90 to-brand-900/95"
        aria-hidden
      />

      <div className={cn('relative', MARKETING_CONTAINER)}>
        <FadeIn>
          <FadeInItem>
            <GlassSurface
              variant="onDark"
              className={cn(
                'mx-auto max-w-4xl rounded-2xl px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12',
                GLASS_ON_DARK_GRADIENT,
              )}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-on-hero-muted sm:text-sm">
                Partner with us
              </p>
              <h2
                id="franchise-teaser-title"
                className="mt-3 text-2xl font-bold tracking-tight text-on-hero text-balance sm:text-3xl lg:text-4xl"
              >
                Become a The WashHouse Partner
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-hero-muted sm:text-base">
                Join India&apos;s doorstep laundry marketplace — we bring customers, you deliver fresh
                clothes with a proven brand behind you.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {FRANCHISE_BENEFITS.map(({ label, icon: Icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-on-hero/15 bg-white/10 px-3 py-3 max-md:[backdrop-filter:none] md:bg-white/5 md:backdrop-blur-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-on-hero">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold leading-snug text-on-hero sm:text-sm">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-6 active:scale-[0.98]"
                >
                  <Link href="/franchise#apply">
                    Apply for franchise
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(
                    'h-11 rounded-full border-on-hero/40 bg-white/10 px-6 text-on-hero shadow-soft max-md:[backdrop-filter:none]',
                    'hover:bg-white/15 hover:text-on-hero active:scale-[0.98] md:backdrop-blur-sm',
                  )}
                >
                  <Link href={CONTACT_FRANCHISE_BROCHURE_HREF}>
                    <Mail className="h-4 w-4" aria-hidden />
                    Request brochure
                  </Link>
                </Button>
              </div>
            </GlassSurface>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
