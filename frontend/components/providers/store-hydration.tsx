'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth.store';
import { useNavNotificationsStore } from '@/store/nav-notifications.store';

/**
 * Rehydrates persisted Zustand stores after mount so SSR and the first client
 * paint share the same initial state (empty defaults).
 */
export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useNavNotificationsStore.persist.rehydrate();
  }, []);

  return null;
}
