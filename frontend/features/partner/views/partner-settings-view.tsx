'use client';

import Link from 'next/link';
import { ExternalLink, Store } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { Button } from '@/components/ui/button';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { PartnerPracticeModeToggle } from '@/features/partner-shop-floor/components/partner-practice-mode-toggle';
import { PartnerFloorVoiceToggle } from '@/features/partner-shop-floor/components/partner-floor-voice-toggle';
import { PartnerUiModeToggle } from '@/features/partner-shop-floor/components/partner-ui-mode-toggle';

export function PartnerSettingsView() {
  const analyticsQ = usePartnerAnalytics();
  const stats = analyticsQ.data;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title="Settings" description="Shop profile and operational preferences." />

      <PartnerPanel title="Shop profile" bodyClassName="px-4 py-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="mt-0.5 font-medium text-foreground">{stats?.laundry_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rating</dt>
            <dd className="mt-0.5 font-medium text-foreground tabular-nums">
              {stats ? `${stats.avg_rating} ★ · ${stats.review_count} reviews` : '—'}
            </dd>
          </div>
        </dl>
      </PartnerPanel>

      <PartnerPanel title="Display mode" bodyClassName="px-4 py-4">
        <PartnerUiModeToggle />
      </PartnerPanel>

      <PartnerPanel title="Practice / training" bodyClassName="px-4 py-4">
        <PartnerPracticeModeToggle />
      </PartnerPanel>

      <PartnerPanel title="Voice / sound (Shop Floor)" bodyClassName="px-4 py-4">
        <PartnerFloorVoiceToggle />
      </PartnerPanel>

      <InfoBanner title="More settings coming soon">
        Service hours, delivery zones, and notification preferences will appear here. Customize your
        public shop in the storefront builder today.
      </InfoBanner>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="/partner/storefront">
          <Store className="h-4 w-4" aria-hidden />
          Open storefront builder
          <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Link>
      </Button>
    </PartnerContent>
  );
}
