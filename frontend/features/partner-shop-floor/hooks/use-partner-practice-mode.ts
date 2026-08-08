'use client';

import { usePartnerPracticeModeStore } from '@/features/partner-shop-floor/store/partner-practice-mode.store';
import { useStoreHydrated } from '@/lib/hooks/use-store-hydrated';

/** Practice mode after localStorage rehydrate; defaults off pre-hydrate. */
export function usePartnerPracticeMode(): {
  enabled: boolean;
  hydrated: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
} {
  const hydrated = useStoreHydrated(usePartnerPracticeModeStore);
  const enabled = usePartnerPracticeModeStore((s) => s.enabled);
  const setEnabled = usePartnerPracticeModeStore((s) => s.setEnabled);
  const toggle = usePartnerPracticeModeStore((s) => s.toggle);

  return {
    enabled: hydrated ? enabled : false,
    hydrated,
    setEnabled,
    toggle,
  };
}
