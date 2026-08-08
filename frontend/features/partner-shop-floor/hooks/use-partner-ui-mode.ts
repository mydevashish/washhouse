'use client';

import { usePartnerUiModeStore } from '@/features/partner-shop-floor/store/partner-ui-mode.store';
import {
  DEFAULT_PARTNER_UI_MODE,
  type PartnerUiMode,
} from '@/features/partner-shop-floor/types';
import { useStoreHydrated } from '@/lib/hooks/use-store-hydrated';

/** Partner UI mode after localStorage rehydrate; defaults to advanced pre-hydrate. */
export function usePartnerUiMode(): {
  mode: PartnerUiMode;
  hydrated: boolean;
  setMode: (mode: PartnerUiMode) => void;
  toggleMode: () => void;
} {
  const hydrated = useStoreHydrated(usePartnerUiModeStore);
  const mode = usePartnerUiModeStore((s) => s.mode);
  const setMode = usePartnerUiModeStore((s) => s.setMode);
  const toggleMode = usePartnerUiModeStore((s) => s.toggleMode);

  return {
    mode: hydrated ? mode : DEFAULT_PARTNER_UI_MODE,
    hydrated,
    setMode,
    toggleMode,
  };
}
