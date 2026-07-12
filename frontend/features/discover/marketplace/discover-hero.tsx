'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Clock, Truck } from 'lucide-react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { HERO_IMAGE } from '@/features/discover/marketplace/laundry-images';

const TRUST = [
  { icon: Clock, label: 'Same-day options', detail: 'Express slots when you need clothes fast' },
  { icon: Truck, label: 'Free pickup & delivery', detail: 'We come to your door — no extra fees' },
  { icon: BadgeCheck, label: 'Verified partners', detail: 'Every laundry is reviewed and approved' },
] as const;

export function DiscoverHero() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-labelledby="discover-hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-brand-50/80 via-bg-0 to-bg-1 dark:from-brand-900/15 dark:via-bg-0 dark:to-bg-1"
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl"
        aria-hidden
      />

      <div className="container relative py-14 sm:py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-3 inline-flex overflow-hidden rounded-md p-0.5 dark:bg-white/90">
              <WashhouseLogo variant="icon" href="/discover" className="opacity-90" />
            </div>
            <p className="inline-flex items-center rounded-full border border-brand-500/20 bg-bg-0 px-3 py-1 text-xs font-semibold text-brand-600 shadow-soft dark:text-brand-50">
              India&apos;s doorstep laundry marketplace
            </p>
            <h1
              id="discover-hero-heading"
              className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-fg-0 sm:text-5xl lg:text-[3.25rem]"
            >
              Professional laundry service at your doorstep
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-fg-1">
              Compare trusted laundries near you, schedule free pickup, track every order, and get fresh
              clothes delivered home — without visiting a shop.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="#partners">
                  Book pickup
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>

            <ul className="mt-10 space-y-4" aria-label="Why customers trust DLM">
              {TRUST.map(({ icon: Icon, label, detail }) => (
                <li key={label} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-900/30">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-fg-0">{label}</span>
                    <span className="mt-0.5 block text-sm text-fg-2">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
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
            <div className="absolute -bottom-5 left-4 right-4 grid grid-cols-2 gap-3 sm:left-6 sm:right-6">
              <div className="rounded-2xl border border-border bg-bg-0/95 px-4 py-3 shadow-pop backdrop-blur">
                <p className="text-xs font-medium text-fg-2">Avg. turnaround</p>
                <p className="text-lg font-bold text-brand-500">24 hours</p>
              </div>
              <div className="rounded-2xl border border-border bg-bg-0/95 px-4 py-3 shadow-pop backdrop-blur">
                <p className="text-xs font-medium text-fg-2">Starting from</p>
                <p className="text-lg font-bold text-success">₹69/kg</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
