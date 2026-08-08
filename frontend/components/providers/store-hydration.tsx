'use client';

import { useEffect } from 'react';

import { usePartnerPracticeModeStore } from '@/features/partner-shop-floor/store/partner-practice-mode.store';
import { usePartnerFloorVoiceStore } from '@/features/partner-shop-floor/store/partner-floor-voice.store';
import { usePartnerUiModeStore } from '@/features/partner-shop-floor/store/partner-ui-mode.store';
import { useAuthStore } from '@/store/auth.store';
import { useNavNotificationsStore } from '@/store/nav-notifications.store';

/**
 * Rehydrates persisted Zustand stores after mount so SSR and the first client
 * paint share the same initial state (empty defaults).
 */
export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist?.rehydrate();
    void useNavNotificationsStore.persist?.rehydrate();
    void usePartnerUiModeStore.persist?.rehydrate();
    void usePartnerPracticeModeStore.persist?.rehydrate();
    void usePartnerFloorVoiceStore.persist?.rehydrate();
  }, []);

  return null;
}
