import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_PARTNER_UI_MODE,
  PARTNER_UI_MODE_STORAGE_KEY,
  normalizePartnerUiMode,
  type PartnerUiMode,
} from '@/features/partner-shop-floor/types';
import { createSsrSafeJSONStorage } from '@/lib/ssr-safe-storage';

type PartnerUiModeState = {
  mode: PartnerUiMode;
  setMode: (mode: PartnerUiMode) => void;
  /** No-op: Shop Floor display mode retired — always stay on advanced shell. */
  toggleMode: () => void;
};

export const usePartnerUiModeStore = create<PartnerUiModeState>()(
  persist(
    (set) => ({
      mode: DEFAULT_PARTNER_UI_MODE,
      /** Always normalize — `shop_floor` writes force `advanced` (P6 single shell). */
      setMode: (mode) => set({ mode: normalizePartnerUiMode(mode) }),
      toggleMode: () => set({ mode: DEFAULT_PARTNER_UI_MODE }),
    }),
    {
      name: PARTNER_UI_MODE_STORAGE_KEY,
      storage: createSsrSafeJSONStorage(),
      partialize: (state) => ({ mode: state.mode }),
      skipHydration: true,
      merge: (persisted, current) => {
        const raw =
          persisted && typeof persisted === 'object' && 'mode' in persisted
            ? (persisted as { mode: unknown }).mode
            : undefined;
        return {
          ...current,
          mode: normalizePartnerUiMode(raw),
        };
      },
    },
  ),
);
