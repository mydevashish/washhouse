import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerLogisticsView } from '@/features/partner/views/partner-logistics-view';

export const metadata = { title: 'Partner · Logistics' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function tabFromSearch(
  raw: string | string[] | undefined,
): 'pickups' | 'deliveries' | 'done' {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'deliveries' || value === 'done') return value;
  return 'pickups';
}

export default async function PartnerLogisticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialTab = tabFromSearch(params.tab);
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerLogisticsView initialTab={initialTab} showTabNav />
    </RoleGuard>
  );
}
