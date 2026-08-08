import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ClipboardList,
  Inbox,
  Package,
  Truck,
  Wallet,
} from 'lucide-react';

import { OWNER_IMAGES } from '@/features/partner/components/owner/owner-assets';
import { isPickupRequest } from '@/features/partner/lib/partner-derive';
import { isOrderNeedsAction } from '@/features/partner/lib/partner-status';
import type { PartnerOrder } from '@/services/partner';

export type OwnerBriefItemData = {
  id: string;
  title: string;
  reason: string;
  href: string;
  count: number;
  icon: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
};

export type BuildOwnerBriefInput = {
  orders: PartnerOrder[];
  /** Assigned booking requests needing contact. */
  bookingRequestsCount?: number;
  delayedOrders?: number;
  /** Pending settlement earnings in INR (optional). */
  pendingSettlementInr?: number;
};

/**
 * Deterministic “Do next” brief for Advanced Owner home.
 * Priority order matches partner-owner-command-center.md (max 5).
 */
export function buildOwnerBriefItems(input: BuildOwnerBriefInput): OwnerBriefItemData[] {
  const {
    orders,
    bookingRequestsCount = 0,
    delayedOrders = 0,
    pendingSettlementInr = 0,
  } = input;

  const needsAction = orders.filter((o) => isOrderNeedsAction(o.status, o.order_source)).length;
  const pickups = orders.filter((o) => isPickupRequest(o.status)).length;
  const readyOnly = orders.filter((o) => o.status === 'ready').length;
  const outForDelivery = orders.filter((o) => o.status === 'out_for_delivery').length;

  const items: OwnerBriefItemData[] = [];

  if (needsAction > 0) {
    items.push({
      id: 'needs-action',
      title: 'Orders need action',
      reason: 'Accept or reject before the queue piles up',
      href: '/partner/orders',
      count: needsAction,
      icon: Package,
      imageSrc: OWNER_IMAGES.orders,
      imageAlt: 'Orders',
    });
  }

  if (bookingRequestsCount > 0) {
    items.push({
      id: 'booking-requests',
      title: 'Booking requests waiting',
      reason: 'New leads need a first call or WhatsApp',
      href: '/partner/orders?tab=requests',
      count: bookingRequestsCount,
      icon: Inbox,
      imageSrc: OWNER_IMAGES.people,
      imageAlt: 'Customers',
    });
  }

  if (pickups > 0) {
    items.push({
      id: 'pickups',
      title: 'Pickups due',
      reason: 'Bags waiting for collection',
      href: '/partner/logistics',
      count: pickups,
      icon: ClipboardList,
      imageSrc: OWNER_IMAGES.logistics,
      imageAlt: 'Pickups',
    });
  }

  if (outForDelivery > 0 || readyOnly > 0) {
    items.push({
      id: 'deliveries',
      title: outForDelivery > 0 ? 'Deliveries out' : 'Ready to hand over',
      reason:
        outForDelivery > 0
          ? 'Keep riders moving on time'
          : 'Customers can collect or you can dispatch',
      href: '/partner/logistics?tab=deliveries',
      count: outForDelivery + readyOnly,
      icon: Truck,
      imageSrc: OWNER_IMAGES.logistics,
      imageAlt: 'Deliveries',
    });
  }

  if (delayedOrders > 0) {
    items.push({
      id: 'delayed',
      title: 'Delayed past window',
      reason: 'Check Operations center for stuck orders',
      href: '/partner/operations',
      count: delayedOrders,
      icon: AlertTriangle,
      imageSrc: OWNER_IMAGES.calm,
      imageAlt: 'Attention',
    });
  }

  if (pendingSettlementInr > 0) {
    items.push({
      id: 'settlement',
      title: 'Settlement earnings pending',
      reason: 'Review what is waiting to be released',
      href: '/partner/settlements',
      count: 1,
      icon: Wallet,
      imageSrc: OWNER_IMAGES.money,
      imageAlt: 'Money',
    });
  }

  return items.slice(0, 5);
}
