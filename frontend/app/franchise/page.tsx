import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Store, TrendingUp, Users } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarketingShell } from '@/components/layout/marketing-shell';

export const metadata: Metadata = {
  title: 'Become a franchise partner',
  description:
    'Grow your laundry business with The WashHouse. Join India\'s doorstep laundry marketplace and reach more customers.',
};

const BENEFITS = [
  {
    icon: Store,
    title: 'Your storefront, amplified',
    description: 'List services, set pricing, and get discovered by customers in your neighbourhood.',
  },
  {
    icon: Users,
    title: 'More orders, less marketing',
    description: 'We bring demand — you focus on quality wash, iron, and delivery.',
  },
  {
    icon: TrendingUp,
    title: 'Dashboard & analytics',
    description: 'Track revenue, manage operations, and grow with transparent commission.',
  },
] as const;

export default function FranchisePage() {
  return (
    <MarketingShell>
      <div className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Partners"
            title="Grow with The WashHouse"
            description="Partner with us to offer doorstep laundry in your city. We handle discovery, booking, and payments — you deliver fresh clothes."
            align="center"
            className="mb-12"
          />

          <ul className="grid gap-4 sm:gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Contact your platform admin to get onboarded, or sign in once your shop is approved.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 w-full rounded-full sm:w-auto">
              <Link href="/login">
                Partner sign in
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 w-full rounded-full sm:w-auto">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
