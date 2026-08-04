import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerOrderDetailView } from '@/features/partner/views/partner-order-detail-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Order details' };

export default async function PartnerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerOrderDetailView orderId={id} />
    </RoleGuard>
  );
}
