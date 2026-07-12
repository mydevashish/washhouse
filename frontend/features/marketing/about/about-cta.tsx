import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AboutCta() {
  return (
    <section aria-labelledby="about-cta-title" className="bg-primary py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="about-cta-title"
          className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl"
        >
          Ready to try The WashHouse?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
          Find a verified laundry near you, or reach out if you have questions. We&apos;re here to
          help.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-full bg-card text-primary hover:bg-card/95 sm:w-auto"
          >
            <Link href="/stores">
              Find a store near you
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 w-full rounded-full border-2 border-primary-foreground/70 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
          >
            <Link href="/contact">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Contact us
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
