'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';

type ShopFloorStubViewProps = {
  title: string;
  english: string;
  description: string;
  icon: LucideIcon;
};

/** Empty stub for floor boards / print until P1–P2. */
export function ShopFloorStubView({ title, english, description, icon }: ShopFloorStubViewProps) {
  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title={title} description={english} />
      <EmptyState
        icon={icon}
        title={`${title} — jald aa raha hai`}
        description={description}
        action={{ label: 'Wapas home', href: '/partner' }}
      />
      <p className="text-center text-sm text-muted-foreground">
        Abhi{' '}
        <Link href="/partner/floor/new" className="font-medium text-primary underline-offset-2 hover:underline">
          Naya Order
        </Link>{' '}
        se order banao, ya Advanced Mode mein Orders Hub use karo.
      </p>
    </PartnerContent>
  );
}
