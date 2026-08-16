'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Package, Store } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { Button } from '@/components/ui/button';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { PartnerPracticeModeToggle } from '@/features/partner-shop-floor/components/partner-practice-mode-toggle';
import { PartnerFloorVoiceToggle } from '@/features/partner-shop-floor/components/partner-floor-voice-toggle';

export function PartnerSettingsView() {
  const analyticsQ = usePartnerAnalytics();
  const stats = analyticsQ.data;

  return (
    <PartnerContent className="space-y-4">
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

      <PartnerPanel title="Where daily work lives" bodyClassName="px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:mx-0">
            <Image
              src="/catalog/heroes/fresh-laundry.webp"
              alt="Folded laundry ready for customers"
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              Orders, customers, and printing live under{' '}
              <span className="font-medium text-foreground">Customers &amp; Orders</span>. There is
              one partner workspace — no separate Shop Floor display mode.
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/partner/orders">
                <Package className="h-4 w-4" aria-hidden />
                Open Customers &amp; Orders
              </Link>
            </Button>
          </div>
        </div>
      </PartnerPanel>

      <PartnerPanel title="Practice / training" bodyClassName="px-4 py-4">
        <PartnerPracticeModeToggle />
      </PartnerPanel>

      <PartnerPanel title="Voice prompts" bodyClassName="px-4 py-4">
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
