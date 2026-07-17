'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BookNowCta } from '@/features/marketing/book-now';
import { HeroStaticFallback } from '@/features/marketing/home/hero-static-fallback';

const HeroCarousel = dynamic(
  () =>
    import('@/features/marketing/home/hero-carousel').then((m) => ({
      default: m.HeroCarousel,
    })),
  { ssr: false, loading: () => <HeroStaticFallback /> },
);

export function MarketingHomeHero() {
  return (
    <section
      aria-labelledby="marketing-hero-title"
      className="relative isolate max-w-full overflow-x-hidden overflow-hidden bg-gradient-to-b from-brand-50/60 via-background to-background pb-6 sm:pb-8 lg:pb-10 dark:from-brand-900/10 dark:via-background"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute right-0 top-16 h-64 w-64 translate-x-1/4 rounded-full bg-primary/8 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/4 translate-y-1/4 rounded-full bg-sky-500/8 blur-3xl" />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1440px] px-4 pb-2 pt-6 sm:px-6 sm:pb-3 sm:pt-8 lg:px-8 lg:pb-3 lg:pt-10">
        <div className="w-full min-w-0">
          <HeroCarousel />

          <div
            className="mx-auto mt-4 flex max-w-lg flex-col gap-3 sm:hidden"
            data-marketing-sticky-cta
          >
            <BookNowCta
              size="lg"
              className="h-11 w-full rounded-full shadow-pop active:scale-[0.98]"
            >
              Book pickup
              <ArrowRight className="h-4 w-4" aria-hidden />
            </BookNowCta>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 w-full rounded-full border-border/80 bg-background/95 shadow-soft backdrop-blur-sm active:scale-[0.98]"
            >
              <Link href="/franchise">Become a partner</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
