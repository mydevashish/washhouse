'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-background to-background dark:from-brand-900/10 dark:via-background"
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8 lg:pb-14 lg:pt-12">
        <div>
          <HeroCarousel />

          <div
            className="mx-auto mt-4 flex max-w-lg flex-col gap-3 sm:hidden"
            data-marketing-sticky-cta
          >
            <Button
              asChild
              size="lg"
              className="h-11 w-full rounded-full shadow-pop active:scale-[0.98]"
            >
              <Link href="/discover#laundries">
                Book pickup
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
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

        <p className="mt-5 text-center text-xs text-muted-foreground sm:text-sm">
          Sign in with phone OTP · No account needed to browse stores
        </p>
      </div>
    </section>
  );
}
