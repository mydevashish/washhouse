'use client';

import { useEffect, useState } from 'react';

import type { StoreApi, UseBoundStore } from 'zustand';

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** True after a persist middleware store has finished rehydrating from storage. */
export function useStoreHydrated<T>(
  store: UseBoundStore<StoreApi<T>> & { persist: PersistApi },
): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());

  useEffect(() => {
    if (store.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return store.persist.onFinishHydration(() => setHydrated(true));
  }, [store]);

  return hydrated;
}
