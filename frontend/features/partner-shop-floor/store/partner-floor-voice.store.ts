import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PARTNER_FLOOR_VOICE_STORAGE_KEY } from '@/features/partner-shop-floor/types';
import { createSsrSafeJSONStorage } from '@/lib/ssr-safe-storage';

type PartnerFloorVoiceState = {
  /** Opt-in voice prompts. Default off — calm by default. */
  enabled: boolean;
  /** Explicit mute — overrides enabled when true. */
  soundOff: boolean;
  setEnabled: (enabled: boolean) => void;
  setSoundOff: (soundOff: boolean) => void;
  toggle: () => void;
};

export const usePartnerFloorVoiceStore = create<PartnerFloorVoiceState>()(
  persist(
    (set, get) => ({
      enabled: false,
      soundOff: false,
      setEnabled: (enabled) => set({ enabled, soundOff: enabled ? false : get().soundOff }),
      setSoundOff: (soundOff) => set({ soundOff, enabled: soundOff ? false : get().enabled }),
      toggle: () => {
        const next = !get().enabled;
        set({ enabled: next, soundOff: next ? false : get().soundOff });
      },
    }),
    {
      name: PARTNER_FLOOR_VOICE_STORAGE_KEY,
      storage: createSsrSafeJSONStorage(),
      partialize: (state) => ({ enabled: state.enabled, soundOff: state.soundOff }),
      skipHydration: true,
      merge: (persisted, current) => {
        const raw =
          persisted && typeof persisted === 'object'
            ? (persisted as { enabled?: unknown; soundOff?: unknown })
            : {};
        return {
          ...current,
          enabled: raw.enabled === true,
          soundOff: raw.soundOff === true,
        };
      },
    },
  ),
);
