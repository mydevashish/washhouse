import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'dlm.auth',
      // Persist only the user — token stays in memory.
      partialize: (state) => ({ user: state.user }),
      /** Avoid SSR/client mismatch; rehydrate in StoreHydration after mount. */
      skipHydration: true,
    },
  ),
);
