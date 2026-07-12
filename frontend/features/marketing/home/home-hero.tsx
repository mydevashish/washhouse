'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { HERO_IMAGE } from '@/features/discover/marketplace/laundry-images';

export function MarketingHomeHero() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-labelledby="marketing-hero-title"
      className="relative overflow-hidden bg-gradient-to-br from-brand-50/80 via-background to-muted/40 dark:from-brand-900/15 dark:via-background dark:to-muted/20"
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 inline-flex overflow-hidden rounded-md p-0.5 dark:bg-white/90">
              <WashhouseLogo adaptive={false} href="/" priority className="h-10 w-auto sm:h-11" />
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
              India&apos;s laundry marketplace
            </p>
            <h1
              id="marketing-hero-title"
              className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl"
            >
              Fresh clothes. Zero trips to the shop.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              The WashHouse connects you with trusted laundries near you — free doorstep pickup,
              live tracking, and delivery back home. Pay with UPI or COD; GST on every order.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-11 w-full rounded-full sm:w-auto">
                <Link href="/discover#laundries">
                  Book pickup
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 w-full rounded-full sm:w-auto"
              >
                <Link href="/franchise">Become a partner</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground sm:text-sm">
              Sign in with phone OTP · No account needed to browse stores
            </p>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-pop ring-1 ring-border lg:rounded-3xl">
              <Image
                src={HERO_IMAGE}
                alt="Neatly folded fresh laundry prepared for home delivery"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 grid grid-cols-2 gap-3 sm:-bottom-5 sm:left-6 sm:right-6">
              <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-pop backdrop-blur">
                <p className="text-xs font-medium text-muted-foreground">Avg. turnaround</p>
                <p className="text-lg font-bold text-primary">24 hours</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-pop backdrop-blur">
                <p className="text-xs font-medium text-muted-foreground">Starting from</p>
                <p className="text-lg font-bold text-success">₹69/kg</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
