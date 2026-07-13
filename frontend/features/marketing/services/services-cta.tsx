import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ServicesCta() {
  return (
    <section aria-labelledby="services-cta-title" className="border-t border-border bg-primary py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="services-cta-title"
          className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl"
        >
          Ready to book your first pickup?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-primary-foreground sm:text-lg">
          Discover verified laundries near you, compare services, and schedule pickup in minutes.
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-full bg-card text-primary hover:bg-card/95 sm:w-auto"
          >
            <Link href="/discover">
              Browse laundries
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
