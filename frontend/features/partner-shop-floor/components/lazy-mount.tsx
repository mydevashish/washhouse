'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type LazyMountProps = {
  children: ReactNode;
  className?: string;
  /** Placeholder min height while off-screen. */
  minHeightClassName?: string;
  rootMargin?: string;
};

/**
 * Mount children only when near the viewport — keeps Cloth Wall TTI lean
 * when many catalog tiles are present.
 */
export function LazyMount({
  children,
  className,
  minHeightClassName = 'min-h-[9rem]',
  rootMargin = '240px 0px',
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn(className)} data-lazy-mount={visible ? 'in' : 'out'}>
      {visible ? (
        children
      ) : (
        <div
          className={cn('rounded-2xl bg-muted/40 ring-1 ring-border/40', minHeightClassName)}
          aria-hidden
        />
      )}
    </div>
  );
}
