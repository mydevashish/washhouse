import Link from 'next/link';
import { LogIn, ShieldCheck, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MarketingGlassCard } from '@/features/marketing/shared/marketing-glass-card';
import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import { loginHrefForAudience } from '@/lib/auth-login-audience';
import { MARKETING_STAFF_HREF } from '@/lib/navigation/marketing-nav';

export function PartnerLoginStrip() {
  return (
    <MarketingSection
      aria-labelledby="partner-login-title"
      className="border-y border-border/60 bg-muted/20"
      header={{
        eyebrow: 'For partners',
        title: 'Already onboarded?',
        description: 'Sign in to your laundry dashboard or platform admin console.',
        align: 'center',
      }}
    >
      <h2 id="partner-login-title" className="sr-only">
        Partner and admin login
      </h2>
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        <MarketingGlassCard
          solidOnMobile
          className="flex h-full flex-col gap-3 p-5 text-center sm:p-6"
          iconSlot={
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" aria-hidden />
            </span>
          }
          title="Laundry login"
          description="Manage orders, pickups, and your storefront."
        >
          <Button asChild className="mt-auto w-full rounded-full font-semibold">
            <Link href={loginHrefForAudience('partner')}>
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </Link>
          </Button>
        </MarketingGlassCard>

        <MarketingGlassCard
          solidOnMobile
          className="flex h-full flex-col gap-3 p-5 text-center sm:p-6"
          iconSlot={
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
          }
          title="Admin login"
          description="Platform operations, approvals, and analytics."
        >
          <Button asChild variant="outline" className="mt-auto w-full rounded-full font-semibold">
            <Link href={loginHrefForAudience('admin')}>
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </Link>
          </Button>
        </MarketingGlassCard>

        <MarketingGlassCard
          solidOnMobile
          className="flex h-full flex-col gap-3 p-5 text-center sm:p-6 sm:col-span-1"
          iconSlot={
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <LogIn className="h-5 w-5" aria-hidden />
            </span>
          }
          title="Staff portal"
          description="Choose laundry or admin workspace."
        >
          <Button asChild variant="secondary" className="mt-auto w-full rounded-full font-semibold">
            <Link href={MARKETING_STAFF_HREF}>Open portal</Link>
          </Button>
        </MarketingGlassCard>
      </div>
    </MarketingSection>
  );
}
