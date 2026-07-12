'use client';

import {
  CheckCircle2,
  Droplets,
  Home,
  KeyRound,
  Package,
  PackageCheck,
  Shield,
  Shirt,
  Truck,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import {
  CUSTODY_ROLE_LABELS,
  type CustodyEvent,
  type CustodyEventType,
} from '@/services/custody-timeline';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<CustodyEventType, LucideIcon> = {
  order_confirmed: CheckCircle2,
  pickup_assigned: UserCheck,
  pickup_photos_uploaded: PackageCheck,
  inventory_recorded: Package,
  inventory_confirmed: Shield,
  pickup_completed: PackageCheck,
  washing_started: Droplets,
  ironing_started: Shirt,
  packaging_completed: Package,
  delivery_assigned: Truck,
  delivery_proof_uploaded: PackageCheck,
  otp_verified: KeyRound,
  delivered: Home,
  order_cancelled: XCircle,
};

type ChainOfCustodyTimelineProps = {
  events: CustodyEvent[];
  className?: string;
  showMetadata?: boolean;
  emptyMessage?: string;
};

function formatMetadata(metadata: Record<string, unknown> | null): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  const parts: string[] = [];
  if (typeof metadata.photo_count === 'number') parts.push(`${metadata.photo_count} photo(s)`);
  if (typeof metadata.total_quantity === 'number') parts.push(`${metadata.total_quantity} item(s)`);
  if (metadata.latitude != null && metadata.longitude != null) {
    parts.push(`GPS ${Number(metadata.latitude).toFixed(4)}, ${Number(metadata.longitude).toFixed(4)}`);
  }
  if (typeof metadata.tracking_code === 'string') parts.push(`#${metadata.tracking_code}`);
  if (typeof metadata.status === 'string') parts.push(metadata.status.replace(/_/g, ' '));
  return parts.length ? parts.join(' · ') : null;
}

export function ChainOfCustodyTimeline({
  events,
  className,
  showMetadata = true,
  emptyMessage = 'No custody events recorded yet.',
}: ChainOfCustodyTimelineProps) {
  if (!events.length) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyMessage}</p>;
  }

  return (
    <ol className={cn('relative space-y-0', className)} aria-label="Chain of custody timeline">
      {events.map((event, index) => {
        const Icon = EVENT_ICONS[event.event_type] ?? Shield;
        const isLast = index === events.length - 1;
        const metaSummary = showMetadata ? formatMetadata(event.metadata) : null;
        const actorLabel = event.actor_name
          ? `${event.actor_name} (${CUSTODY_ROLE_LABELS[event.actor_role]})`
          : CUSTODY_ROLE_LABELS[event.actor_role];

        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[1.15rem] top-10 -ml-px h-[calc(100%-1.5rem)] w-0.5 bg-border"
                aria-hidden
              />
            )}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-semibold text-foreground">{event.label}</p>
              <time dateTime={event.created_at} className="mt-0.5 block text-sm tabular-nums text-muted-foreground">
                {formatOrderTimestamp(event.created_at)}
              </time>
              <p className="mt-1 text-xs text-muted-foreground">
                Actor: <span className="font-medium text-foreground/80">{actorLabel}</span>
              </p>
              {metaSummary && (
                <p className="mt-1 text-xs text-muted-foreground">{metaSummary}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
