'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  leftSrc: string | null;
  rightSrc: string | null;
  leftAlt: string;
  rightAlt: string;
  leftLoading?: boolean;
  rightLoading?: boolean;
  className?: string;
};

export function EvidenceCompareSlider({
  leftSrc,
  rightSrc,
  leftAlt,
  rightAlt,
  leftLoading,
  rightLoading,
  className,
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
  };

  const loading = leftLoading || rightLoading;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.offsetWidth));
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted', className)}
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/80">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {rightSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rightSrc} alt={rightAlt} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      )}
      {leftSrc && (
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={leftSrc}
            alt={leftAlt}
            className="absolute left-0 top-0 h-full object-contain"
            style={{ width: containerWidth > 0 ? containerWidth : '100%' }}
            draggable={false}
          />
        </div>
      )}
      {!leftSrc && !rightSrc && !loading && (
        <p className="flex h-full items-center justify-center text-xs text-muted-foreground">No images to compare</p>
      )}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare pickup and delivery photos"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        className="absolute inset-y-0 z-10 w-8 -translate-x-1/2 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ left: `${position}%` }}
        onPointerDown={(e) => {
          dragging.current = true;
          updateFromClientX(e.clientX);
        }}
        onKeyDown={onKeyDown}
      >
        <div className="mx-auto h-full w-0.5 bg-white shadow-md" />
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md">
          <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
        </span>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        Pickup
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        Delivery
      </span>
    </div>
  );
}
