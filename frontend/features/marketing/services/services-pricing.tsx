import { BadgeIndianRupee, CreditCard, Receipt, Truck } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { PRICING_POINTS } from '@/features/marketing/services/services-data';

const PRICING_ICONS = {
  gst: Receipt,
  delivery: Truck,
  upi: BadgeIndianRupee,
  cod: CreditCard,
} as const;

export function ServicesPricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="services-pricing-title"
      className="scroll-mt-20 border-t border-border bg-card py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Transparent pricing"
          title="How pricing works"
          description="No hidden fees — here's what shows up on your bill when you book through The WashHouse."
          align="center"
          className="mb-10"
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          {PRICING_POINTS.map(({ id, title, description }) => {
            const Icon = PRICING_ICONS[id];
            return (
              <li key={id}>
                <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
