import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ShieldCheck, Store } from 'lucide-react';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { Button } from '@/components/ui/button';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { loginHrefForAudience } from '@/lib/auth-login-audience';

const title = `Staff portal — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Sign in to the WashHouse laundry partner console or platform admin dashboard.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
};

const PORTAL_CARDS = [
  {
    id: 'laundry',
    title: 'Laundry partner',
    description:
      'For approved laundry shops and staff — manage daily orders, pickups, deliveries, and storefront settings.',
    href: loginHrefForAudience('partner'),
    cta: 'Laundry login',
    icon: Store,
    accent: 'text-brand-500',
  },
  {
    id: 'admin',
    title: 'Platform admin',
    description:
      'For WashHouse operations — approve partners, monitor orders, settlements, disputes, and platform health.',
    href: loginHrefForAudience('admin'),
    cta: 'Admin login',
    icon: ShieldCheck,
    accent: 'text-sky-500',
  },
] as const;

export default function StaffPortalPage() {
  return (
    <MarketingShell>
      <MarketingSection
        header={{
          eyebrow: 'Partners & operations',
          title: 'Staff portal',
          description:
            'Choose your workspace. Use the work email and password issued when your account was created.',
          align: 'center',
        }}
        className="min-h-[60vh]"
      >
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {PORTAL_CARDS.map(({ id, title, description, href, cta, icon: Icon, accent }) => (
            <MarketingGlassCard key={id} className="flex h-full flex-col gap-4 p-6 sm:p-8">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${accent}`}
                aria-hidden
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <Button asChild className="mt-auto w-full rounded-full font-semibold">
                <Link href={href}>{cta}</Link>
              </Button>
            </MarketingGlassCard>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-3 text-center text-sm text-muted-foreground">
          <Building2 className="h-5 w-5 text-primary" aria-hidden />
          <p>
            Not onboarded yet?{' '}
            <Link href="/franchise#apply" className="font-semibold text-primary hover:underline">
              Apply for a laundry franchise
            </Link>{' '}
            or{' '}
            <Link href="/contact?subject=partnership" className="font-semibold text-primary hover:underline">
              contact partnerships
            </Link>
            .
          </p>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
