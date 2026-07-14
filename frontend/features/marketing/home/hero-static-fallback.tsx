'use client';

import { Check, MessageCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import {
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import {
  HERO_SLIDES,
  WHATSAPP_BOOKING_MESSAGE,
} from '@/features/marketing/home/hero-slides';
import {
  GLASS_MOBILE_SOLID_CARD,
  MARKETING_HERO_GRID,
  MARKETING_HERO_HEADLINE,
  MARKETING_HERO_IMAGE_COL,
  MARKETING_HERO_IMAGE_FRAME,
  MARKETING_HERO_TEXT_COL,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

const welcomeSlide = HERO_SLIDES[0]!;
const whatsappHref = buildWhatsAppHref(
  CONTACT_CONFIG.whatsapp,
  WHATSAPP_BOOKING_MESSAGE,
);

/** Server-friendly first slide — paints LCP before the Embla carousel chunk hydrates. */
export function HeroStaticFallback() {
  if (welcomeSlide.variant !== 'welcome') return null;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-background lg:rounded-3xl">
      <div className={MARKETING_HERO_GRID}>
        <div className={MARKETING_HERO_TEXT_COL}>
          <div className="mb-3 flex flex-col gap-3 sm:mb-4">
            <WashhouseLogo adaptive={false} href="/" priority className="h-9 w-auto sm:h-10" />
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
              India&apos;s laundry marketplace
            </p>
          </div>

          <h2 id="marketing-hero-title" className={MARKETING_HERO_HEADLINE}>
            {welcomeSlide.headline}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
            {welcomeSlide.pills.map((pill, pillIndex) => (
              <span key={pill} className="inline-flex items-center gap-2">
                {pillIndex > 0 ? (
                  <span className="text-muted-foreground/50" aria-hidden>
                    |
                  </span>
                ) : null}
                {pill}
              </span>
            ))}
          </div>

          <ul className="mt-4 space-y-2 sm:hidden">
            {welcomeSlide.trustItems.map(({ label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <Button
            asChild
            size="lg"
            variant="success"
            className="mt-5 h-11 rounded-full px-6"
            data-marketing-sticky-cta
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Book on WhatsApp
            </a>
          </Button>
        </div>

        <div className={MARKETING_HERO_IMAGE_COL}>
          <div className={MARKETING_HERO_IMAGE_FRAME}>
            <Image
              src={welcomeSlide.image}
              alt={welcomeSlide.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1023px) calc(100vw - 2rem), (max-width: 1280px) 50vw, 720px"
              priority
              fetchPriority="high"
            />
            <div
              className={cn('absolute inset-0', welcomeSlide.overlayClassName)}
              aria-hidden
            />
            <GlassSurface
              variant="strong"
              className={cn(
                'absolute bottom-4 right-4 z-10 hidden max-w-[11rem] rounded-xl p-3 shadow-pop sm:block lg:bottom-8 lg:right-8 lg:max-w-[12rem] lg:p-4',
                GLASS_MOBILE_SOLID_CARD,
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-success sm:text-sm">
                {welcomeSlide.promo.badge}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-foreground sm:text-base">
                {welcomeSlide.promo.code}
              </p>
            </GlassSurface>
          </div>
        </div>
      </div>
    </div>
  );
}
