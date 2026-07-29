'use client';

import { useEffect, useState } from 'react';

const BOTTOM_CTA_SELECTOR = '[data-marketing-bottom-cta]';

/** True when a marketing final CTA band is intersecting the viewport. */
export function useFinalCtaVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll(BOTTOM_CTA_SELECTOR));
    if (targets.length === 0) return;

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          setVisible(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05));
        },
        { threshold: [0, 0.05, 0.15], rootMargin: '0px 0px -80px 0px' },
      );
      targets.forEach((target) => observer!.observe(target));
    } catch {
      return;
    }

    return () => observer?.disconnect();
  }, []);

  return visible;
}
