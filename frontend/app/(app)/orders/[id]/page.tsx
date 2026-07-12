import { OrderTracking } from '@/features/orders/order-tracking';

export const metadata = { title: 'Track order' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6">
      <OrderTracking orderId={id} />
    </div>
  );
}
