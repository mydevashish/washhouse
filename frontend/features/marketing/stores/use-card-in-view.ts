'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element intersects the viewport (with rootMargin).
 * Used to defer per-card contact GETs until the store card is near view —
 * avoids N+1 contact storms when the directory lists many partners.
 */
export function useCardInView<T extends HTMLElement>(rootMargin = '120px 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
