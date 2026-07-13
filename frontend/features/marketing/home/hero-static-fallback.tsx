'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { GlassSurface } from '@/components/ui/glass-surface';
import { HERO_IMAGE } from '@/features/discover/marketplace/laundry-images';

/** Server-friendly first slide — paints LCP before the Embla carousel chunk hydrates. */
export function HeroStaticFallback() {
  return (
    <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
      <div className="relative aspect-[4/5] min-h-[22rem] pb-16 sm:aspect-[16/10] sm:min-h-[26rem] sm:pb-0 lg:aspect-[21/9] lg:min-h-[28rem]">
        <Image
          src={HERO_IMAGE}
          alt="Neatly folded fresh laundry prepared for home delivery"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
          priority
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-500/75 via-brand-600/55 to-sky-500/45 dark:from-brand-900/80 dark:via-brand-600/50 dark:to-sky-500/35"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-end p-4 sm:items-center sm:p-6 lg:p-10">
          <GlassSurface
            variant="strong"
            className="w-full max-w-xl rounded-2xl p-5 shadow-pop sm:p-6 lg:max-w-2xl lg:p-8"
          >
            <div className="mb-3 flex flex-col gap-3 sm:mb-4">
              <div className="inline-flex w-fit overflow-hidden rounded-md p-0.5 dark:bg-white/90">
                <WashhouseLogo adaptive={false} href="/" priority className="h-9 w-auto sm:h-10" />
              </div>
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
                India&apos;s laundry marketplace
              </p>
            </div>
            <h2
              id="marketing-hero-title"
              className="text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl"
            >
              Fresh clothes. Zero trips.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              The WashHouse connects you with trusted laundries near you — free doorstep pickup, live
              tracking, and delivery back home.
            </p>
          </GlassSurface>
        </div>
      </div>
    </div>
  );
}
