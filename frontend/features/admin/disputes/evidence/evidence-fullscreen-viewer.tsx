'use client';

import { useCallback, useEffect } from 'react';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EvidenceCompareSlider } from '@/features/admin/disputes/evidence/evidence-compare-slider';
import { useZoomPan } from '@/features/admin/disputes/evidence/use-evidence-image';
import { cn } from '@/lib/utils';

type ViewMode = 'side-by-side' | 'slider';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: ViewMode;
  pickupSrc: string | null;
  deliverySrc: string | null;
  pickupAlt: string;
  deliveryAlt: string;
  pickupLoading?: boolean;
  deliveryLoading?: boolean;
};

export function EvidenceFullscreenViewer({
  open,
  onClose,
  mode,
  pickupSrc,
  deliverySrc,
  pickupAlt,
  deliveryAlt,
  pickupLoading,
  deliveryLoading,
}: Props) {
  const pickupZoom = useZoomPan(5);
  const deliveryZoom = useZoomPan(5);

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [open, onEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence comparison fullscreen"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-sm font-medium text-white">Evidence comparison</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="Close fullscreen"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-4">
        {mode === 'slider' ? (
          <EvidenceCompareSlider
            leftSrc={pickupSrc}
            rightSrc={deliverySrc}
            leftAlt={pickupAlt}
            rightAlt={deliveryAlt}
            leftLoading={pickupLoading}
            rightLoading={deliveryLoading}
            className="h-full max-h-[calc(100vh-8rem)] flex-1"
          />
        ) : (
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <FullscreenPane
              src={pickupSrc}
              alt={pickupAlt}
              label="Pickup"
              zoom={pickupZoom}
              loading={pickupLoading}
            />
            <FullscreenPane
              src={deliverySrc}
              alt={deliveryAlt}
              label="Delivery"
              zoom={deliveryZoom}
              loading={deliveryLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FullscreenPane({
  src,
  alt,
  label,
  zoom,
  loading,
}: {
  src: string | null;
  alt: string;
  label: string;
  zoom: ReturnType<typeof useZoomPan>;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</span>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10" onClick={zoom.zoomIn} aria-label={`Zoom in ${label}`}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10" onClick={zoom.zoomOut} aria-label={`Zoom out ${label}`}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px] text-white hover:bg-white/10" onClick={zoom.reset}>
            Reset
          </Button>
        </div>
      </div>
      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden rounded-lg bg-black/40',
          zoom.scale > 1 && 'cursor-grab active:cursor-grabbing',
        )}
        onWheel={zoom.onWheel}
        onPointerDown={zoom.onPointerDown}
        onPointerMove={zoom.onPointerMove}
        onPointerUp={zoom.onPointerUp}
        onPointerCancel={zoom.onPointerUp}
      >
        {loading && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/60">Loading…</p>}
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="h-full w-full object-contain"
            style={{
              transform: `translate(${zoom.offset.x}px, ${zoom.offset.y}px) scale(${zoom.scale})`,
              transformOrigin: 'center center',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function FullscreenTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onClick}>
      <Maximize2 className="h-3.5 w-3.5" aria-hidden />
      Fullscreen
    </Button>
  );
}
