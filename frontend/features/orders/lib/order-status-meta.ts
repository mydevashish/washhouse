import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Droplets,
  Home,
  Package,
  PackageCheck,
  Shirt,
  Truck,
  UserCheck,
} from 'lucide-react';

import { formatIndiaDateTime, formatIndiaDelivery } from '@/lib/datetime';
import type { OrderStatusEvent } from '@/services/orders';

/** Customer-facing tracking steps (excludes cancelled). */
export const TRACKING_STATUS_ORDER = [
  'confirmed',
  'pickup_assigned',
  'picked_up',
  'washing',
  'ironing',
  'ready',
  'out_for_delivery',
  'delivered',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUS_ORDER)[number];

export type TimelineStepState = 'complete' | 'current' | 'upcoming';

export type TimelineStep = {
  status: TrackingStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  state: TimelineStepState;
  timestamp: string | null;
};

const META: Record<
  TrackingStatus,
  { label: string; description: string; icon: LucideIcon }
> = {
  confirmed: {
    label: 'Order Confirmed',
    description: 'Your order is confirmed',
    icon: CheckCircle2,
  },
  pickup_assigned: {
    label: 'Pickup Assigned',
    description: 'A partner will collect your clothes',
    icon: UserCheck,
  },
  picked_up: {
    label: 'Picked Up',
    description: 'Items collected from your address',
    icon: PackageCheck,
  },
  washing: {
    label: 'Washing',
    description: 'Your laundry is being washed',
    icon: Droplets,
  },
  ironing: {
    label: 'Ironing',
    description: 'Finishing with care',
    icon: Shirt,
  },
  ready: {
    label: 'Ready',
    description: 'Packed and ready to go',
    icon: Package,
  },
  out_for_delivery: {
    label: 'Out For Delivery',
    description: 'On the way to you',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    description: 'Enjoy fresh laundry',
    icon: Home,
  },
};

const SHORT_LABEL: Record<string, string> = {
  ...Object.fromEntries(
    TRACKING_STATUS_ORDER.map((s) => [s, META[s].label]),
  ),
  cancelled: 'Cancelled',
};

export function getOrderStatusLabel(status: string): string {
  return SHORT_LABEL[status] ?? status.replace(/_/g, ' ');
}

export function formatOrderTimestamp(iso: string): string {
  return formatIndiaDateTime(iso);
}

export function formatEstimatedDelivery(iso: string): string {
  return formatIndiaDelivery(iso);
}

function isTrackingStatus(status: string): status is TrackingStatus {
  return (TRACKING_STATUS_ORDER as readonly string[]).includes(status);
}

export function buildOrderTimeline(
  currentStatus: string,
  events: OrderStatusEvent[],
): TimelineStep[] {
  if (!isTrackingStatus(currentStatus)) {
    return [];
  }

  const currentIndex = TRACKING_STATUS_ORDER.indexOf(currentStatus);
  const timestampByStatus = new Map<string, string>();

  for (const event of events) {
    if (!timestampByStatus.has(event.status)) {
      timestampByStatus.set(event.status, event.created_at);
    }
  }

  return TRACKING_STATUS_ORDER.map((status, index) => {
    let state: TimelineStepState = 'upcoming';
    if (index < currentIndex) state = 'complete';
    else if (index === currentIndex) state = 'current';

    const meta = META[status];
    return {
      status,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      state,
      timestamp: timestampByStatus.get(status) ?? null,
    };
  });
}

export function trackingProgressPercent(currentStatus: string): number {
  if (!isTrackingStatus(currentStatus)) return 0;
  const index = TRACKING_STATUS_ORDER.indexOf(currentStatus);
  return Math.round(((index + 1) / TRACKING_STATUS_ORDER.length) * 100);
}
