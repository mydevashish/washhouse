import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PARTNER_PRACTICE_MODE_STORAGE_KEY } from '@/features/partner-shop-floor/types';
import { createSsrSafeJSONStorage } from '@/lib/ssr-safe-storage';

type PartnerPracticeModeState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
};

export const usePartnerPracticeModeStore = create<PartnerPracticeModeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set({ enabled: !get().enabled }),
    }),
    {
      name: PARTNER_PRACTICE_MODE_STORAGE_KEY,
      storage: createSsrSafeJSONStorage(),
      partialize: (state) => ({ enabled: state.enabled }),
      skipHydration: true,
      merge: (persisted, current) => {
        const raw =
          persisted && typeof persisted === 'object' && 'enabled' in persisted
            ? (persisted as { enabled: unknown }).enabled
            : undefined;
        return {
          ...current,
          enabled: raw === true,
        };
      },
    },
  ),
);
