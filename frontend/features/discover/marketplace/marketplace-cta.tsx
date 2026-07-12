'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section } from '@/features/discover/marketplace/section';

export function MarketplaceCta() {
  return (
    <Section tone="default" className="pb-20 sm:pb-24">
      <FadeIn>
        <FadeInItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-900 px-5 py-8 text-center shadow-pop sm:px-10 sm:py-10">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl"
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-on-hero-muted">Ready to start?</p>
            <h2 className="section-title mt-2 text-on-hero">
              Book your first pickup in under 2 minutes
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-on-hero-muted">
              No subscription required. Pay per order. Sign in only when you are ready to book.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full rounded-lg bg-card text-primary hover:bg-card/95 sm:w-auto"
              >
                <Link href="#partners">
                  Book pickup now
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-lg border-primary-foreground/40 bg-transparent text-on-hero hover:bg-primary-foreground/10 sm:w-auto"
              >
                <Link href="/login">Sign in to track orders</Link>
              </Button>
            </div>
            <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs text-on-hero-muted">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Verified partners · Secure payments · Satisfaction-first service
            </p>
          </div>
        </FadeInItem>
      </FadeIn>
    </Section>
  );
}
