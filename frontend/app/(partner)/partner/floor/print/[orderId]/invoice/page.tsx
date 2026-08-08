import { RoleGuard } from '@/components/auth/role-guard';
import { PrintOrderInvoiceView } from '@/features/partner-shop-floor/views/print-order-invoice-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · GST invoice' };

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PartnerFloorPrintInvoicePage({ params }: PageProps) {
  const { orderId } = await params;
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PrintOrderInvoiceView orderId={orderId} />
    </RoleGuard>
  );
}
