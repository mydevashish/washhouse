import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SERVICE_CATEGORIES } from '@/features/marketing/services/services-data';

export function ServicesGrid() {
  return (
    <section aria-labelledby="services-grid-title" className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What we offer"
          title="Pick a service, pick a laundry"
          description="These are platform-wide service types. Final pricing and turnaround come from each store's listing."
          align="center"
          className="mb-10"
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {SERVICE_CATEGORIES.map(
            ({
              id,
              title,
              description,
              icon: Icon,
              accent,
              turnaround,
              priceFrom,
              optional,
              ctaHref = '/discover',
              ctaLabel = 'Browse laundries',
            }) => (
              <li key={id}>
                <Card className="flex h-full flex-col rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      {optional ? (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Optional
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>

                    <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" aria-hidden />
                          Turnaround
                        </dt>
                        <dd className="font-medium text-foreground">{turnaround}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Starting from</dt>
                        <dd className="font-semibold text-primary">{priceFrom}</dd>
                      </div>
                    </dl>

                    <Button asChild variant="outline" size="default" className="mt-5 w-full rounded-full">
                      <Link href={ctaHref}>
                        {ctaLabel}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ),
          )}
        </ul>

        <p className="mx-auto mt-8 max-w-prose text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <strong className="font-medium text-foreground">Indicative pricing only.</strong> Final
          rates are set by each laundry partner and shown on their store page before you book.
        </p>
      </div>
    </section>
  );
}
