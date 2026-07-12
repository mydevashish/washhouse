import { Eye, Heart, Sparkles, Zap } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';

const VALUES = [
  {
    icon: Sparkles,
    title: 'Quality',
    description: 'Fresh, well-finished clothes — every time. We hold partners to standards we would expect ourselves.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Clear pricing, honest timelines, and open communication. No surprises on your bill or at your door.',
    accent: 'bg-info-muted text-info',
  },
  {
    icon: Zap,
    title: 'Convenience',
    description: 'Doorstep pickup, phone OTP login, and tracking that actually works. Laundry on your schedule.',
    accent: 'bg-success-muted text-success',
  },
  {
    icon: Heart,
    title: 'Community',
    description: 'We grow with local laundries and the neighbourhoods they serve — not at their expense.',
    accent: 'bg-warning-muted text-warning',
  },
] as const;

export function AboutValues() {
  return (
    <section aria-labelledby="about-values-title" className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What we stand for"
          title="Our values"
          description="These guide every product decision and every partner we welcome onto the platform."
          align="center"
          className="mb-10"
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {VALUES.map(({ icon: Icon, title, description, accent }) => (
            <li key={title}>
              <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
                <CardContent className="p-6">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
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
