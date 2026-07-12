import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function StoresCta() {
  return (
    <section aria-labelledby="stores-cta-title" className="border-t border-border bg-primary py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="stores-cta-title"
          className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl"
        >
          Don&apos;t see your area?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
          We&apos;re expanding across India. Tell us where you are — we&apos;ll let you know when a
          WashHouse partner opens nearby.
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-full bg-card text-primary hover:bg-card/95 sm:w-auto"
          >
            <Link href="/contact">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Get in touch
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
