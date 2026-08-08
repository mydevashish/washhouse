import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_PARTNER_UI_MODE,
  PARTNER_UI_MODE_STORAGE_KEY,
  isPartnerUiMode,
  type PartnerUiMode,
} from '@/features/partner-shop-floor/types';
import { createSsrSafeJSONStorage } from '@/lib/ssr-safe-storage';

type PartnerUiModeState = {
  mode: PartnerUiMode;
  setMode: (mode: PartnerUiMode) => void;
  toggleMode: () => void;
};

export const usePartnerUiModeStore = create<PartnerUiModeState>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_PARTNER_UI_MODE,
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === 'shop_floor' ? 'advanced' : 'shop_floor' }),
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
          mode: isPartnerUiMode(raw) ? raw : DEFAULT_PARTNER_UI_MODE,
        };
      },
    },
  ),
);
