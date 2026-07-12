'use client';

import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useZoomPan } from '@/features/admin/disputes/evidence/use-evidence-image';

type Props = {
  src: string | null;
  alt: string;
  loading?: boolean;
  failed?: boolean;
  label?: string;
  className?: string;
  showControls?: boolean;
};

export function EvidenceZoomPane({
  src,
  alt,
  loading,
  failed,
  label,
  className,
  showControls = true,
}: Props) {
  const zoom = useZoomPan(4);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <p className="text-xs font-semibold text-foreground">{label}</p>}
      <div className="relative">
        {showControls && (
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={zoom.zoomIn} aria-label="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={zoom.zoomOut} aria-label="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={zoom.reset}>
              Reset
            </Button>
          </div>
        )}
        <div
          className={cn(
            'relative aspect-[4/3] overflow-hidden rounded-lg bg-muted',
            zoom.scale > 1 && 'cursor-grab active:cursor-grabbing',
          )}
          onWheel={zoom.onWheel}
          onPointerDown={zoom.onPointerDown}
          onPointerMove={zoom.onPointerMove}
          onPointerUp={zoom.onPointerUp}
          onPointerCancel={zoom.onPointerUp}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Image unavailable
            </div>
          )}
          {src && !failed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="h-full w-full object-contain transition-transform duration-75"
              style={{
                transform: `translate(${zoom.offset.x}px, ${zoom.offset.y}px) scale(${zoom.scale})`,
                transformOrigin: 'center center',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
