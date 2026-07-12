import { BadgeIndianRupee, MapPin, ShieldCheck, Smartphone } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified partners',
    description: 'Every laundry is reviewed and approved before they go live on the platform.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: Smartphone,
    title: 'Real-time tracking',
    description: 'Follow your order from pickup to wash, ready, and out for delivery — live updates.',
    accent: 'bg-info-muted text-info',
  },
  {
    icon: BadgeIndianRupee,
    title: 'GST-compliant pricing',
    description: 'See the full breakdown before you book. GST is always shown on your order.',
    accent: 'bg-success-muted text-success',
  },
  {
    icon: MapPin,
    title: 'UPI + COD',
    description: 'Pay how you prefer — instant UPI or cash on delivery when your clothes arrive.',
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
