'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PREFIX = 'dlm.scroll.';

/** Saves and restores main content scroll position per route. */
export function useScrollRestore(containerId = 'main-content') {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const key = PREFIX + pathname;
    const el = document.getElementById(containerId);

    if (prevPath.current && prevPath.current !== pathname) {
      const prevEl = document.getElementById(containerId);
      if (prevEl) {
        sessionStorage.setItem(PREFIX + prevPath.current, String(prevEl.scrollTop));
      }
    }

    if (el) {
      const saved = sessionStorage.getItem(key);
      if (saved != null) {
        requestAnimationFrame(() => {
          el.scrollTop = Number(saved) || 0;
        });
      }
    }

    prevPath.current = pathname;
  }, [pathname, containerId]);
}
