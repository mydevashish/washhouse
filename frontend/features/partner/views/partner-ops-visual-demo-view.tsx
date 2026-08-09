'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PartnerContent,
  PartnerPageHeader,
} from '@/features/partner/components/partner-content';
import {
  PartnerOpsHero,
  PartnerOpsKpiGrid,
  PartnerOpsSectionLabel,
  PartnerOpsStatusBars,
  PartnerOpsSurface,
  PartnerOpsTrendStrip,
} from '@/features/partner/components/ops-visual';

const DEMO_KPIS = [
  { label: 'Orders today', value: '28' },
  { label: 'Delivered today (gross)', value: '₹12,540' },
  { label: 'Unpaid orders', value: '6', href: '/partner/orders?chip=unpaid' },
  { label: 'New this week', value: '18', delta: { label: '+3 vs last week', tone: 'success' as const } },
];

const DEMO_STATUS = [
  { label: 'Awaiting pickup', value: 12, colorToken: 'primary' as const },
  { label: 'In shop', value: 8, colorToken: 'secondary' as const },
  { label: 'Ready', value: 4, colorToken: 'success' as const },
  { label: 'Delivered today', value: 16, colorToken: 'muted' as const },
];

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Static composition preview for Prompt 1 primitives (no API). */
export function PartnerOpsVisualDemoView() {
  return (
    <PartnerContent className="space-y-6 pb-10">
      <PartnerPageHeader
        title="Ops visual primitives"
        description="WashHouse ops chrome — presentational building blocks for /partner dashboard (demo data only)."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/partner">Back to home</Link>
          </Button>
        }
      />

      <PartnerOpsSurface>
        <PartnerOpsHero
          badge={<Badge variant="secondary">Needs action · 3</Badge>}
          title="Create a new laundry order quickly"
          description="Search customer, add services, and print tags — same visual language as the owner command center."
          imageSrc="/marketing/heroes/services.webp"
          imageAlt="Laundry services"
        />
        <div className="mt-6 space-y-6">
          <PartnerOpsKpiGrid items={DEMO_KPIS} />
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <PartnerOpsSectionLabel>Order status overview</PartnerOpsSectionLabel>
              <PartnerOpsStatusBars rows={DEMO_STATUS} aria-label="Order status overview" />
            </div>
            <PartnerOpsTrendStrip data={WEEK_LABELS.map((label, index) => ({ label, value: index * 2 }))} emptyHref="/partner/revenue" />
          </div>
        </div>
      </PartnerOpsSurface>

      <PartnerOpsSurface variant="muted">
        <PartnerOpsSectionLabel>Muted inset surface</PartnerOpsSectionLabel>
        <p className="mt-2 text-sm text-muted-foreground">Use for nested panels inside the main ops shell.</p>
      </PartnerOpsSurface>

      <PartnerOpsSurface variant="flush">
        <div className="border-b border-border px-5 py-3">
          <PartnerOpsSectionLabel>Flush surface (tables)</PartnerOpsSectionLabel>
        </div>
        <div className="px-5 py-4 text-sm text-muted-foreground">Table body would sit flush to the shell edge.</div>
      </PartnerOpsSurface>

      <PartnerOpsSurface variant="default" className="space-y-3">
        <PartnerOpsSectionLabel>Empty trend</PartnerOpsSectionLabel>
        <PartnerOpsTrendStrip
          data={WEEK_LABELS.map((label) => ({ label, value: 0 }))}
          emptyHref="/partner/revenue"
        />
      </PartnerOpsSurface>
    </PartnerContent>
  );
}
