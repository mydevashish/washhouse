'use client';

import {
  OrderCreateSuccessPanel,
  type OrderCreateSuccessOrder,
} from '@/features/partner-shop-floor/components/order-create-success-panel';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

type WalkInSuccessPanelProps = {
  order: WalkInOrder;
  onStartWash: () => void;
  startWashPending?: boolean;
};

/**
 * Walk-in / Cloth Wall create success — Print tags primary (P5 lifecycle).
 */
export function WalkInSuccessPanel({
  order,
  onStartWash,
  startWashPending,
}: WalkInSuccessPanelProps) {
  const successOrder: OrderCreateSuccessOrder = {
    id: order.id,
    tracking_code: order.tracking_code,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    total_inr: order.total_inr,
    color_token: order.color_token,
    token_code: order.token_code,
    status: order.status,
  };

  return (
    <OrderCreateSuccessPanel
      order={successOrder}
      onStartWash={onStartWash}
      startWashPending={startWashPending}
      showStartWash
      anotherOrderHref="/partner/new-order?mode=walk_in"
    />
  );
}
