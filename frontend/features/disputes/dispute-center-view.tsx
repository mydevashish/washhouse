'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { PageHeader } from '@/components/navigation/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { DeliveryProofDisplay } from '@/features/delivery-proof';
import { InventoryVerificationDisplay } from '@/features/inventory-verification';
import { DisputePhotosGallery } from '@/features/disputes/components/dispute-photos-gallery';
import { DisputeStatusTimeline } from '@/features/disputes/components/dispute-status-timeline';
import { PAGE_CONTAINER, PAGE_SECTION } from '@/lib/page-layout';
import { queryKeys } from '@/lib/query-keys';
import {
  DISPUTE_STATUS_LABELS,
  getDisputeDetail,
  listMyDisputes,
} from '@/services/disputes';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function DisputeStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-semibold',
        status === 'resolved' && 'bg-success-muted text-success',
        status === 'open' && 'bg-warning-muted text-warning',
        (status === 'investigating' || status === 'in_review') && 'bg-primary/10 text-primary',
        status === 'rejected' && 'bg-danger-muted text-danger',
        status === 'escalated' && 'bg-destructive/10 text-destructive',
      )}
    >
      {DISPUTE_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
    </span>
  );
}

function DisputeDetailPanel({ disputeId, onBack }: { disputeId: string; onBack: () => void }) {
  const detailQ = useQuery({
    queryKey: queryKeys.complaint(disputeId),
    queryFn: () => getDisputeDetail(disputeId),
  });

  if (detailQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (detailQ.error || !detailQ.data) {
    return (
      <InfoBanner variant="destructive" title="Could not load dispute">
        <button type="button" className="underline" onClick={onBack}>
          Back to list
        </button>
      </InfoBanner>
    );
  }

  const d = detailQ.data;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-primary hover:underline">
        ← All disputes
      </button>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{d.type_label}</p>
            {d.tracking_code && (
              <p className="mt-1 font-mono text-sm font-semibold">Order #{d.tracking_code}</p>
            )}
          </div>
          <DisputeStatusBadge status={d.status} />
        </div>
        <p className="mt-4 text-sm text-foreground">{d.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Filed <ClientDate iso={d.created_at} mode="datetime" />
        </p>
        {d.order_id && (
          <Link
            href={`/orders/${d.order_id}`}
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            View order
          </Link>
        )}
      </article>

      {d.status_events.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-bold text-foreground">Status updates</h3>
          <DisputeStatusTimeline events={d.status_events} className="mt-4" />
        </section>
      )}

      {d.photos.length > 0 && <DisputePhotosGallery photos={d.photos} />}

      {d.delivery_proof && (
        <DeliveryProofDisplay
          photo={d.delivery_proof}
          title="Delivery proof record"
          description="Reference for this dispute — photo captured at delivery."
        />
      )}

      {d.inventory_verification && (
        <InventoryVerificationDisplay
          verification={d.inventory_verification}
          title="Locked inventory record"
          description="Reference for this dispute — counts confirmed at pickup."
        />
      )}
    </div>
  );
}

export function DisputeCenterView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const disputesQ = useQuery({
    queryKey: queryKeys.complaints(),
    queryFn: listMyDisputes,
  });

  return (
    <div className={PAGE_CONTAINER}>
      <PageHeader
        title="Dispute center"
        description="Track issues with your orders. Attach photos and notes when filing a report."
      />

      <div className={PAGE_SECTION}>
        {selectedId ? (
          <DisputeDetailPanel disputeId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            {disputesQ.isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}
            {disputesQ.isError && (
              <InfoBanner variant="destructive" title="Could not load disputes">
                Refresh to try again.
              </InfoBanner>
            )}
            {disputesQ.data && disputesQ.data.length === 0 && (
              <EmptyState
                icon={AlertTriangle}
                title="No disputes yet"
                description="If something goes wrong with an order, file a dispute from your order tracking page."
                action={{ label: 'Your orders', href: '/orders' }}
              />
            )}
            {disputesQ.data && disputesQ.data.length > 0 && (
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
                {disputesQ.data.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/40"
                      onClick={() => setSelectedId(d.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{d.type_label}</span>
                          <DisputeStatusBadge status={d.status} />
                        </div>
                        {d.tracking_code && (
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{d.tracking_code}</p>
                        )}
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                        {d.photo_count > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">{d.photo_count} photo(s) attached</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
