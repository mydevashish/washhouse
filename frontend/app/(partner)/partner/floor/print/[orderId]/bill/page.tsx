import { RoleGuard } from '@/components/auth/role-guard';
import { PrintOrderBillView } from '@/features/partner-shop-floor/views/print-order-bill-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Print bill' };

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PartnerFloorPrintBillPage({ params }: PageProps) {
  const { orderId } = await params;
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PrintOrderBillView orderId={orderId} />
    </RoleGuard>
  );
}
