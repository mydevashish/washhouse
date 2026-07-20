import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Short teaser on Services — full pricing lives on `/pricing`. Keeps `#pricing` for old bookmarks. */
export function ServicesPricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="services-pricing-title"
      className="scroll-mt-20 border-t border-border bg-card py-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Transparent pricing"
          title="How pricing works"
          description="Indicative starting-from rates by category — the same catalogue and floors across partner stores. Final prices are set by each laundry and shown before you confirm."
          align="center"
          className="mb-8"
        />
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-11 w-full rounded-full sm:w-auto',
          )}
        >
          View full pricing
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
