'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Columns2, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { EvidenceCompareSlider } from '@/features/admin/disputes/evidence/evidence-compare-slider';
import {
  EvidenceFullscreenViewer,
  FullscreenTrigger,
} from '@/features/admin/disputes/evidence/evidence-fullscreen-viewer';
import { EvidenceMetadataPanel } from '@/features/admin/disputes/evidence/evidence-metadata-panel';
import { EvidenceZoomPane } from '@/features/admin/disputes/evidence/evidence-zoom-pane';
import { useEvidenceImage } from '@/features/admin/disputes/evidence/use-evidence-image';
import { fetchDeliveryProofImage, type DeliveryProofPhoto } from '@/services/delivery-proof';
import { fetchPickupEvidenceImage, type PickupEvidencePhoto } from '@/services/pickup-evidence';
import { cn } from '@/lib/utils';

type ViewMode = 'side-by-side' | 'slider';

type Props = {
  pickupPhotos: PickupEvidencePhoto[];
  deliveryPhoto: DeliveryProofPhoto | null;
  className?: string;
};

export function EvidenceComparisonView({ pickupPhotos, deliveryPhoto, className }: Props) {
  const sortedPickup = useMemo(
    () =>
      [...pickupPhotos].sort(
        (a, b) => a.sort_index - b.sort_index || a.created_at.localeCompare(b.created_at),
      ),
    [pickupPhotos],
  );

  const [pickupIndex, setPickupIndex] = useState(0);
  const [mode, setMode] = useState<ViewMode>('side-by-side');
  const [fullscreen, setFullscreen] = useState(false);

  const activePickup = sortedPickup[pickupIndex] ?? sortedPickup[0] ?? null;

  const pickupImage = useEvidenceImage(
    activePickup ? (variant) => fetchPickupEvidenceImage(activePickup, variant) : null,
    [activePickup?.id],
  );

  const deliveryImage = useEvidenceImage(
    deliveryPhoto ? (variant) => fetchDeliveryProofImage(deliveryPhoto, variant) : null,
    [deliveryPhoto?.id],
  );

  if (!sortedPickup.length && !deliveryPhoto) return null;

  const pickupMeta = activePickup
    ? {
        capturedAt: activePickup.captured_at ?? activePickup.created_at,
        latitude: activePickup.latitude,
        longitude: activePickup.longitude,
        uploadedByName: activePickup.uploaded_by_name,
        uploadedByUserId: activePickup.uploaded_by_user_id,
      }
    : null;

  const deliveryMeta = deliveryPhoto
    ? {
        capturedAt: deliveryPhoto.captured_at ?? deliveryPhoto.created_at,
        latitude: deliveryPhoto.latitude,
        longitude: deliveryPhoto.longitude,
        uploadedByName: deliveryPhoto.uploaded_by_name,
        uploadedByUserId: deliveryPhoto.uploaded_by_user_id,
      }
    : null;

  return (
    <>
      <AdminPanel
        title="Evidence comparison"
        bodyClassName={cn('space-y-4 p-3', className)}
        toolbar={
          <div className="flex flex-wrap items-center gap-1">
            <ViewModeButton
              active={mode === 'side-by-side'}
              onClick={() => setMode('side-by-side')}
              icon={Columns2}
              label="Side by side"
            />
            <ViewModeButton
              active={mode === 'slider'}
              onClick={() => setMode('slider')}
              icon={SlidersHorizontal}
              label="Compare slider"
            />
            <FullscreenTrigger onClick={() => setFullscreen(true)} />
          </div>
        }
      >
        <p className="text-xs text-muted-foreground">
          Compare pickup vs delivery evidence. Drag the slider, zoom with controls or scroll wheel, and open fullscreen
          for detailed review.
        </p>

        {sortedPickup.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pickup photo selection">
            {sortedPickup.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                role="tab"
                aria-selected={index === pickupIndex}
                className={cn(
                  'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                  index === pickupIndex
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50',
                )}
                onClick={() => setPickupIndex(index)}
              >
                Pickup {index + 1}
              </button>
            ))}
          </div>
        )}

        {mode === 'slider' ? (
          <EvidenceCompareSlider
            leftSrc={pickupImage.src}
            rightSrc={deliveryImage.src}
            leftAlt="Pickup evidence"
            rightAlt="Delivery evidence"
            leftLoading={pickupImage.loading}
            rightLoading={deliveryImage.loading}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowLeftRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
                Pickup photos
              </div>
              <EvidenceZoomPane
                src={pickupImage.src}
                alt="Pickup evidence"
                loading={pickupImage.loading}
                failed={pickupImage.failed}
                showControls
              />
              {pickupMeta && <EvidenceMetadataPanel metadata={pickupMeta} compact />}
              {!activePickup && (
                <p className="text-xs text-muted-foreground">No pickup photos on this order.</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery photos
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
              </div>
              <EvidenceZoomPane
                src={deliveryImage.src}
                alt="Delivery evidence"
                loading={deliveryImage.loading}
                failed={deliveryImage.failed}
                showControls
              />
              {deliveryMeta && <EvidenceMetadataPanel metadata={deliveryMeta} compact />}
              {!deliveryPhoto && (
                <p className="text-xs text-muted-foreground">No delivery proof on this order.</p>
              )}
            </div>
          </div>
        )}

        {mode === 'slider' && (pickupMeta || deliveryMeta) && (
          <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
            {pickupMeta && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-muted-foreground">Pickup metadata</p>
                <EvidenceMetadataPanel metadata={pickupMeta} />
              </div>
            )}
            {deliveryMeta && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-muted-foreground">Delivery metadata</p>
                <EvidenceMetadataPanel metadata={deliveryMeta} />
              </div>
            )}
          </div>
        )}
      </AdminPanel>

      <EvidenceFullscreenViewer
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        mode={mode}
        pickupSrc={pickupImage.src}
        deliverySrc={deliveryImage.src}
        pickupAlt="Pickup evidence"
        deliveryAlt="Delivery evidence"
        pickupLoading={pickupImage.loading}
        deliveryLoading={deliveryImage.loading}
      />
    </>
  );
}

function ViewModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Columns2;
  label: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="h-7 gap-1 px-2 text-[11px]"
      onClick={onClick}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  );
}
