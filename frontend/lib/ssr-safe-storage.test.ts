import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createSsrSafeJSONStorage } from '@/lib/ssr-safe-storage';

describe('createSsrSafeJSONStorage', () => {
  it('keeps persist API when default localStorage storage would throw', () => {
    const broken = create<{ n: number }>()(
      persist(() => ({ n: 0 }), {
        name: 'dlm.test-broken-persist',
        // Mimic Node: createJSONStorage(() => localStorage) returns undefined when getStorage throws
        storage: createJSONStorage(() => {
          throw new Error('localStorage unavailable');
        }),
        skipHydration: true,
      }),
    );
    expect(broken.persist).toBeUndefined();

    const safe = create<{ n: number }>()(
      persist(() => ({ n: 0 }), {
        name: 'dlm.test-ssr-persist',
        storage: createSsrSafeJSONStorage(),
        skipHydration: true,
      }),
    );
    expect(safe.persist).toBeDefined();
    expect(safe.persist.hasHydrated()).toBe(false);
  });
});
