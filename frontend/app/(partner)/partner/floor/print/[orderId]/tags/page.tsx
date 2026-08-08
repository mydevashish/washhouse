import { RoleGuard } from '@/components/auth/role-guard';
import { PrintOrderTagsView } from '@/features/partner-shop-floor/views/print-order-tags-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Print tags' };

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PartnerFloorPrintTagsPage({ params }: PageProps) {
  const { orderId } = await params;
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PrintOrderTagsView orderId={orderId} />
    </RoleGuard>
  );
}
