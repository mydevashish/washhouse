'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/features/discover/marketplace/fade-in';
import { StoresCard } from '@/features/marketing/stores/stores-card';
import {
  LAUNCH_STORE,
  LAUNCH_STORE_CONTACT,
  LAUNCH_STORE_DETAILS,
} from '@/features/marketing/stores/launch-store';
import {
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

export function FeaturedStoresTeaser() {
  return (
    <section
      aria-labelledby="featured-stores-title"
      className={cn('bg-muted/30', MARKETING_SECTION_PY)}
    >
      <div className={MARKETING_CONTAINER}>
        {/* No FadeInItem: store cards + Browse CTA stay visible (WCAG 2.4.7). */}
        <FadeIn>
          <SectionHeader
            eyebrow="Stores"
            title="Verified WashHouse partners"
            description="Every partner is verified before going live. Find a store by neighbourhood and book pickup in minutes."
            align="center"
            className="mb-10"
          />

          <ul className="grid grid-cols-1 gap-5 md:gap-6">
            <li className="min-w-0">
              <StoresCard
                laundry={LAUNCH_STORE}
                contactOverride={LAUNCH_STORE_CONTACT}
                details={LAUNCH_STORE_DETAILS}
              />
            </li>
          </ul>

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-11 min-h-11 rounded-full">
              <Link href="/stores">
                Browse all stores
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
