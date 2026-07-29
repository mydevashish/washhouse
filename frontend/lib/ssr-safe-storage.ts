import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** No-op storage so Zustand persist can attach its API during SSR (no localStorage). */
const ssrSafeStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * JSON storage that does not throw when `localStorage` is missing (Node / prerender).
 * Without this, Zustand skips attaching `store.persist` and `hasHydrated` crashes SSR.
 */
export function createSsrSafeJSONStorage() {
  return createJSONStorage(() =>
    typeof window === 'undefined' ? ssrSafeStorage : localStorage,
  );
}
