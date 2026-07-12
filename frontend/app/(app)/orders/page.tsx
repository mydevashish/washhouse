import { PageHeader } from '@/components/navigation/page-header';
import { OrdersList } from '@/features/orders/orders-list';
import { PAGE_CONTAINER, PAGE_SECTION } from '@/lib/page-layout';

export const metadata = { title: 'Your orders' };

export default function OrdersPage() {
  return (
    <div className={`${PAGE_CONTAINER} ${PAGE_SECTION}`}>
      <PageHeader
        title="Orders"
        description="Track pickup, wash, and delivery in real time."
        hint="Tap an order to see the full timeline and estimated delivery."
      />
      <OrdersList />
    </div>
  );
}
