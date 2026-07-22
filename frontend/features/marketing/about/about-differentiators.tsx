import { BadgeIndianRupee, MapPin, ShieldCheck, Smartphone } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Trusted Laundry Partners',
    description:
      'We connect you with reliable local laundry partners committed to quality garment care.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: Smartphone,
    title: 'Easy Booking',
    description:
      'Book your laundry pickup in minutes using our simple booking form or WhatsApp.',
    accent: 'bg-info-muted text-info',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Transparent Pricing',
    description:
      'View service pricing upfront. Your final quotation is shared before your order is confirmed.',
    accent: 'bg-success-muted text-success',
  },
  {
    icon: MapPin,
    title: 'Doorstep Pickup & Delivery',
    description:
      'Schedule a convenient pickup and enjoy clean clothes delivered back to your doorstep.',
    accent: 'bg-warning-muted text-warning',
  },
] as const;

export function AboutDifferentiators() {
  return (
    <section
      aria-labelledby="about-differentiators-title"
      className="border-t border-border bg-card py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What makes us different"
          title="Built for how India actually does laundry"
          description="We combine neighbourhood laundries with the convenience you expect from modern apps."
          align="center"
          className="mb-10"
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          {ITEMS.map(({ icon: Icon, title, description, accent }) => (
            <li key={title}>
              <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
                <CardContent className="flex gap-4 p-6">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
