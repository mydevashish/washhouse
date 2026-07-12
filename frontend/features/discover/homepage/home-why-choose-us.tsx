import { BadgeIndianRupee, Package, ShieldCheck, Truck } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Package,
    title: 'Free doorstep pickup',
    description: 'Schedule a slot — we collect from your home at no extra charge.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Truck,
    title: 'Fast, reliable delivery',
    description: 'Standard and express options from verified partners near you.',
    color: 'bg-info-muted text-info',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Upfront pricing',
    description: 'See per-kg rates before you book. No surprise fees on the platform.',
    color: 'bg-success-muted text-success',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted partners only',
    description: 'Every laundry is reviewed, rated, and approved before going live.',
    color: 'bg-warning-muted text-warning',
  },
] as const;

export function HomeWhyChooseUs() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="why-choose-title"
      className="border-t border-border bg-card py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why DLM"
          title="Laundry made simple"
          description="We built DLM so booking professional laundry feels as easy as ordering food."
          align="center"
          className="mb-12"
        />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <li key={title}>
              <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                <CardContent className="p-6 sm:p-8">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
