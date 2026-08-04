'use client';

import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminOrdersHub } from '@/features/admin/orders-hub/admin-orders-hub';

export function AdminOrdersView() {
  return (
    <AdminContent className="space-y-5">
      <AdminOrdersHub />
    </AdminContent>
  );
}
