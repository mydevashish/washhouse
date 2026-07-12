'use client';

import Image from 'next/image';
import { ArrowDown, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HERO_IMAGE } from '@/features/discover/marketplace/laundry-images';

export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-foreground/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center text-on-hero">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
            India&apos;s laundry marketplace
          </p>
          <h1
            id="home-hero-title"
            className="mt-4 text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-4xl"
          >
            Professional laundry service at your doorstep
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-hero-muted sm:text-base">
            Compare top-rated laundries, schedule pickup, and get fresh clothes delivered back to
            your home.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-10 w-full rounded-full bg-card text-sm font-bold text-primary shadow-pop hover:bg-card/95 sm:w-auto sm:px-6"
            >
              <a href="#laundries">Book pickup</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-10 w-full rounded-full border-2 border-primary-foreground/80 bg-transparent text-sm font-semibold text-on-hero hover:bg-primary-foreground/10 sm:w-auto sm:px-6"
            >
              <a href="#laundries">Browse laundries</a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-on-hero-muted">
            Free pickup · Transparent pricing · Live order tracking
          </p>

          <a
            href="#laundries"
            className="mt-8 inline-flex flex-col items-center gap-1 text-sm font-medium text-on-hero-muted transition-colors hover:text-on-hero"
            aria-label="Scroll to laundry listings"
          >
            <span>Explore nearby</span>
            <ArrowDown className="h-5 w-5 animate-bounce" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
