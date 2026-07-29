'use client';

import { useEffect, useState } from 'react';

import type { StoreApi, UseBoundStore } from 'zustand';

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** True after a persist middleware store has finished rehydrating from storage. */
export function useStoreHydrated<T>(
  store: UseBoundStore<StoreApi<T>> & { persist?: PersistApi },
): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist?.hasHydrated() ?? false);

  useEffect(() => {
    const persistApi = store.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, [store]);

  return hydrated;
}
