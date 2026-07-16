'use client';

import { useEffect, useState } from 'react';

type UseSectionScrollSpyOptions = {
  /** IntersectionObserver rootMargin — account for sticky headers. */
  rootMargin?: string;
  enabled?: boolean;
};

/**
 * Tracks which section id is currently in view via IntersectionObserver.
 * Read-only: does not update `location.hash` (avoids fighting HashScrollHandler).
 */
export function useSectionScrollSpy(
  sectionIds: readonly string[],
  { rootMargin = '-20% 0px -55% 0px', enabled = true }: UseSectionScrollSpyOptions = {},
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionKey = sectionIds.join('\0');

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      setActiveId(null);
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const pickActive = () => {
      let bestId: string | null = null;
      let bestRatio = 0;

      for (const id of sectionIds) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      setActiveId(bestRatio > 0 ? bestId : null);
    };

    let observer: IntersectionObserver | undefined;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = entry.target.id;
            if (!id) continue;
            if (entry.isIntersecting) {
              ratios.set(id, entry.intersectionRatio);
            } else {
              ratios.delete(id);
            }
          }
          pickActive();
        },
        {
          rootMargin,
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        },
      );

      elements.forEach((el) => observer!.observe(el));
    } catch {
      return;
    }

    return () => observer?.disconnect();
  }, [enabled, rootMargin, sectionKey, sectionIds]);

  return activeId;
}
