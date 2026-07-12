'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { getBackAriaLabel, getBackFallbackHref, shouldShowBack } from '@/lib/navigation/back';
import type { AppContext } from '@/lib/navigation/types';

export function useSmartBack(app: AppContext) {
  const pathname = usePathname();
  const router = useRouter();
  const fallback = getBackFallbackHref(pathname, app);
  const visible = shouldShowBack(pathname, app);
  const ariaLabel = getBackAriaLabel(pathname, app);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }, [router, fallback]);

  return { goBack, visible, fallback, ariaLabel };
}
